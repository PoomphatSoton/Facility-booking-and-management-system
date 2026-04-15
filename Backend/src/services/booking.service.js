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

/**
 * Member submits a reservation request
 * @param {Object} params
 * @param {string} params.userId -  user_id
 * @param {number} params.facilityId
 * @param {string} params.slotDate - 'YYYY-MM-DD'
 * @param {string} params.startTime - 'HH:MM'
 * @param {string} params.endTime - 'HH:MM'
 * @param {string} params.intendedActivity - Activity description
 * @returns {Object} Created request information
 */
const submitBookingRequest = async ({
                                        userId,
                                        facilityId,
                                        slotDate,
                                        startTime,
                                        endTime,
                                        intendedActivity,
                                    }) => {
    // 1. Find the member_id corresponding to the current user
    const memberResult = await pool.query(
        `SELECT member_id FROM public.members WHERE user_id = $1`,
        [userId]
    );
    if (memberResult.rows.length === 0) {
        throw new Error('MEMBER_NOT_FOUND');
    }
    const memberId = memberResult.rows[0].member_id;

    // 2. Check if the venue exists
    const facilityResult = await pool.query(
        `SELECT facility_id FROM public.facilities WHERE facility_id = $1`,
        [facilityId]
    );
    if (facilityResult.rows.length === 0) {
        throw new Error('FACILITY_NOT_FOUND');
    }

    // 3. Check that the time slot exists and is not in the past
    const slotResult = await pool.query(
        `SELECT slot_time_id FROM public.facility_slot_times
     WHERE facility_id = $1 
       AND slot_date = $2 
       AND slot_start_time = $3 
       AND slot_end_time = $4
       AND slot_date >= CURRENT_DATE`,
        [facilityId, slotDate, startTime, endTime]
    );
    if (slotResult.rows.length === 0) {
        throw new Error('SLOT_NOT_AVAILABLE');
    }

    // 4. Check whether this member already has a pending request for the same time slot (to prevent duplicate submissions)
    const duplicateResult = await pool.query(
        `SELECT br.booking_request_id
     FROM public.booking_requests br
     JOIN public.booking_details bd ON br.booking_detail_id = bd.booking_detail_id
     WHERE bd.member_id = $1
       AND bd.facility_id = $2
       AND bd.date = $3
       AND bd.start_time = $4
       AND bd.end_time = $5
       AND br.request_status = 'pending'`,
        [memberId, facilityId, slotDate, startTime, endTime]
    );
    if (duplicateResult.rows.length > 0) {
        throw new Error('DUPLICATE_REQUEST');
    }

    // 5. Insert booking_details
    const detailResult = await pool.query(
        `INSERT INTO public.booking_details 
       (facility_id, date, start_time, end_time, intended_activity, member_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING booking_detail_id`,
        [facilityId, slotDate, startTime, endTime, intendedActivity || null, memberId]
    );
    const bookingDetailId = detailResult.rows[0].booking_detail_id;

    // 6. Insert booking_requests
    const requestResult = await pool.query(
        `INSERT INTO public.booking_requests (booking_detail_id, request_status)
     VALUES ($1, 'pending')
     RETURNING booking_request_id, request_status, created_at`,
        [bookingDetailId]
    );

    return {
        bookingRequestId: requestResult.rows[0].booking_request_id,
        bookingDetailId,
        status: requestResult.rows[0].request_status,
        createdAt: requestResult.rows[0].created_at,
    };
};

module.exports = {
    getAvailableSlots,
    submitBookingRequest,
};