const { pool } = require('../config/db');

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const getDayOfWeekLabel = (date) => DAY_NAMES[date.getDay()];

const getSlotTime = async ({ facilityIds, slotDate }) => {
  if (!facilityIds.length) return new Map();

  const result = await pool.query(
    `
      SELECT
        facility_id,
        TO_CHAR(slot_start_time, 'HH24:MI') AS slot_start_time,
        TO_CHAR(slot_end_time, 'HH24:MI') AS slot_end_time
      FROM public.facility_slot_times
      WHERE facility_id = ANY($1::int[])
        AND slot_date = $2::date
        AND is_booking = FALSE
      ORDER BY facility_id, slot_start_time
    `,
    [facilityIds, slotDate]
  );

  const slotMap = new Map();

  for (const row of result.rows) {
    const slotText = `${row.slot_start_time}-${row.slot_end_time}`;
    const currentSlots = slotMap.get(row.facility_id) || [];
    currentSlots.push(slotText);
    slotMap.set(row.facility_id, currentSlots);
  }

  return slotMap;
};

const getAvailableTime = async ({ facilityIds }) => {
  if (!facilityIds.length) return new Map();

  const result = await pool.query(
    `
      SELECT
        facility_id,
        day_of_week,
        TO_CHAR(MIN(start_time), 'HH24:MI') AS start_time,
        TO_CHAR(MAX(end_time), 'HH24:MI') AS end_time
      FROM public.facility_schedules
      WHERE facility_id = ANY($1::int[])
      GROUP BY facility_id, day_of_week
      ORDER BY facility_id, ARRAY_POSITION(ARRAY['sun','mon','tue','wed','thu','fri','sat'], day_of_week)
    `,
    [facilityIds]
  );

  const availableMap = new Map();

  for (const row of result.rows) {
    const current = availableMap.get(row.facility_id) || [];
    current.push({
      day: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
    });
    availableMap.set(row.facility_id, current);
  }

  return availableMap;
};

const getFacilityCards = async () => {
  const facilityResult = await pool.query(
    `
      SELECT
        facility_id,
        name,
        description,
        usage_guideline,
        image_url,
        max_people
      FROM public.facilities
      ORDER BY facility_id ASC
    `
  );

  const facilities = facilityResult.rows;
  const facilityIds = facilities.map((facility) => facility.facility_id);

  const today = new Date();
  const slotDate = today.toISOString().slice(0, 10);
  const dayOfWeek = getDayOfWeekLabel(today);
  console.log("day of week", dayOfWeek);
  const [slotTimesByFacility, allSchedulesByFacility] = await Promise.all([
    getSlotTime({ facilityIds, slotDate }),
    getAvailableTime({ facilityIds }),
  ]);

  return facilities.map((facility) => {
    const allSchedules = allSchedulesByFacility.get(facility.facility_id) || [];
    const availableTime = allSchedules.find((s) => s.day === dayOfWeek) || null;
    console.log("availableTime = ", availableTime);
    const otherAvailableTimes = allSchedules.filter((s) => s.day !== dayOfWeek);

    return {
      facilityId: facility.facility_id,
      name: facility.name,
      description: facility.description,
      usageGuideline: facility.usage_guideline,
      imageUrl: facility.image_url ?? null,
      maxPeople: facility.max_people,
      slotDate,
      slotToday: slotTimesByFacility.get(facility.facility_id) || [],
      availableTime,
      otherAvailableTimes,
    };
  });
};

const updateFacility = async (facilityId, data) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      name,
      description,
      usageGuideline,
      imageUrl,
      maxPeople,
      schedules = [],
      slotTimes = [],
    } = data;
// Update facility details
    const facilityResult = await client.query(
      `
      UPDATE public.facilities
      SET
        name = $1,
        description = $2,
        usage_guideline = $3,
        max_people = $4,
        image_url = $5
      WHERE facility_id = $6
      RETURNING *
      `,
      [
        name,
        description ?? null,
        usageGuideline ?? null,
        maxPeople,
        imageUrl ?? null,
        facilityId,
      ]
    );

    if (facilityResult.rows.length === 0) {
      throw new Error('Facility not found');
    }

// delete old schedules and insert new one
    await client.query(
      `
      DELETE FROM public.facility_schedules
      WHERE facility_id = $1
      `,
      [facilityId]
    );

    for (const schedule of schedules) {
      await client.query(
        `
        INSERT INTO public.facility_schedules
          (facility_id, day_of_week, start_time, end_time)
        VALUES ($1, $2, $3, $4)
        `,
        [
          facilityId,
          schedule.dayOfWeek,
          schedule.startTime,
          schedule.endTime,
        ]
      );
    }

    // Delete non-booked slots and replace with new ones
    await client.query(
      `DELETE FROM public.facility_slot_times WHERE facility_id = $1 AND is_booking = FALSE`,
      [facilityId]
    );

    for (const slot of slotTimes) {
      await client.query(
        `
        INSERT INTO public.facility_slot_times
          (facility_id, slot_date, slot_start_time, slot_end_time, is_booking)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [facilityId, slot.slotDate, slot.startTime, slot.endTime, slot.isBooking ?? false]
      );
    }

    await client.query('COMMIT');

    return facilityResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const deleteFacility = async (facilityId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `
      DELETE FROM public.facilities
      WHERE facility_id = $1
      RETURNING *
      `,
      [facilityId]
    );

    if (result.rows.length === 0) {
      throw new Error('Facility not found');
    }

    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const createFacility = async (data) => {
  console.log("createFacility data = ", data);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      name,
      description,
      usageGuideline,
      imageUrl,
      maxPeople,
      schedules = [],
      slotTimes = [],
    } = data;

    const facilityResult = await client.query(
      `
      INSERT INTO public.facilities
        (name, description, usage_guideline, image_url, max_people)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        name,
        description ?? null,
        usageGuideline ?? null,
        imageUrl ?? null,
        maxPeople,
      ]
    );

    const facility = facilityResult.rows[0];

    for (const schedule of schedules) {
      await client.query(
        `
        INSERT INTO public.facility_schedules
          (facility_id, day_of_week, start_time, end_time)
        VALUES ($1, $2, $3, $4)
        `,
        [
          facility.facility_id,
          schedule.dayOfWeek,
          schedule.startTime,
          schedule.endTime,
        ]
      );
    }

    for (const slot of slotTimes) {
      await client.query(
        `
        INSERT INTO public.facility_slot_times
          (facility_id, slot_date, slot_start_time, slot_end_time, is_booking)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [facility.facility_id, slot.slotDate, slot.startTime, slot.endTime, slot.isBooking ?? false]
      );
    }

    await client.query('COMMIT');

    return facility;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getSlotTime,
  getAvailableTime,
  getFacilityCards,
  updateFacility,
  deleteFacility,
  createFacility
};
