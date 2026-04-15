const { pool } = require('../config/db');

/**
 * Retrieve the available time slots for a specific venue in the next N days
 * @param {number} facilityId - ID
 * @param {number} daysAhead - 7
 * @returns {Array} slotDate, startTime, endTime, available
 */
const getAvailableSlots = async (facilityId, daysAhead = 7) => {
    // 1. First verify that the venue exists and retrieve max_people at the same time
    const facilityResult = await pool.query(
        `SELECT facility_id, name, max_people 
     FROM public.facilities 
     WHERE facility_id = $1`,
        [facilityId]
    );

    if (facilityResult.rows.length === 0) {
        throw new Error('FACILITY_NOT_FOUND');
    }

    const facility = facilityResult.rows[0];
    const maxPeople = facility.max_people;

    // 2. Query all predefined time slots for the next N days
    const slotsResult = await pool.query(
        `SELECT 
        slot_time_id,
        slot_date,
        TO_CHAR(slot_start_time, 'HH24:MI') AS start_time,
        TO_CHAR(slot_end_time, 'HH24:MI') AS end_time
     FROM public.facility_slot_times
     WHERE facility_id = $1
       AND slot_date >= CURRENT_DATE
       AND slot_date < CURRENT_DATE + ($2 || ' days')::interval
     ORDER BY slot_date, slot_start_time`,
        [facilityId, daysAhead]
    );

    const slots = slotsResult.rows;

    if (slots.length === 0) {
        return { facilityId, facilityName: facility.name, maxPeople, slots: [] };
    }

    // 3. Query all approved and non-cancelled reservations on these dates to calculate the occupancy count.
    const occupancyResult = await pool.query(
        `SELECT 
        bd.date,
        TO_CHAR(bd.start_time, 'HH24:MI') AS start_time,
        TO_CHAR(bd.end_time, 'HH24:MI') AS end_time,
        COUNT(*) AS occupied_count
     FROM public.bookings b
     JOIN public.booking_details bd ON b.booking_detail_id = bd.booking_detail_id
     WHERE bd.facility_id = $1
       AND bd.date >= CURRENT_DATE
       AND bd.date < CURRENT_DATE + ($2 || ' days')::interval
       AND b.booking_status != 'cancelled'
     GROUP BY bd.date, bd.start_time, bd.end_time`,
        [facilityId, daysAhead]
    );

    const occupancyMap = new Map();
    for (const row of occupancyResult.rows) {
        const key = `${row.date.toISOString().slice(0, 10)}_${row.start_time}_${row.end_time}`;
        occupancyMap.set(key, parseInt(row.occupied_count, 10));
    }

    // 4. Mark whether each time slot is available
    const enrichedSlots = slots.map((slot) => {
        const dateStr = slot.slot_date.toISOString().slice(0, 10);
        const key = `${dateStr}_${slot.start_time}_${slot.end_time}`;
        const occupied = occupancyMap.get(key) || 0;
        return {
            slotTimeId: slot.slot_time_id,
            slotDate: dateStr,
            startTime: slot.start_time,
            endTime: slot.end_time,
            occupied,
            available: occupied < maxPeople,
        };
    });

    return {
        facilityId: facility.facility_id,
        facilityName: facility.name,
        maxPeople,
        slots: enrichedSlots,
    };
};

module.exports = {
    getAvailableSlots,
};