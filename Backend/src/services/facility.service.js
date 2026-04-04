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

  // Fetch all days at once, split today vs other days in getFacilityCards
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

  // Map<facilityId, Array<{day, startTime, endTime}>>
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
        max_people
      FROM public.facilities
      ORDER BY facility_id ASC
    `
  );

  const facilities = facilityResult.rows;
//   console.log("Get facilities", facilities);
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
      maxPeople: facility.max_people,
      slotDate,
      slotToday: slotTimesByFacility.get(facility.facility_id) || [],
      availableTime,
      otherAvailableTimes,
    };
  });
};

module.exports = {
  getSlotTime,
  getAvailableTime,
  getFacilityCards,
};
