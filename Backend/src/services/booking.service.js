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

/**
 * Retrieve all pending reservation requests for the venues managed by a specific staff member
 * @param {string} userId - user_id
 * @returns {Array} List of pending approval requests
 */
const getPendingRequestsForStaff = async (userId) => {
    // 1. user staff_id
    const staffResult = await pool.query(
        `SELECT staff_id FROM public.staff WHERE user_id = $1`,
        [userId]
    );
    if (staffResult.rows.length === 0) {
        throw new Error('STAFF_NOT_FOUND');
    }
    const staffId = staffResult.rows[0].staff_id;

    // 2. Retrieve all pending requests for the venues managed by this staff member
    const result = await pool.query(
        `
    SELECT
      br.booking_request_id,
      br.request_status,
      br.created_at,
      bd.booking_detail_id,
      bd.facility_id,
      f.name AS facility_name,
      bd.date,
      TO_CHAR(bd.start_time, 'HH24:MI') AS start_time,
      TO_CHAR(bd.end_time, 'HH24:MI') AS end_time,
      bd.intended_activity,
      bd.member_id,
      u.first_name AS member_first_name,
      u.last_name AS member_last_name,
      u.email AS member_email
    FROM public.booking_requests br
    JOIN public.booking_details bd ON br.booking_detail_id = bd.booking_detail_id
    JOIN public.facilities f ON bd.facility_id = f.facility_id
    JOIN public.staff_facilities sf ON sf.facility_id = bd.facility_id
    JOIN public.members m ON bd.member_id = m.member_id
    JOIN public.users u ON m.user_id = u.id
    WHERE sf.staff_id = $1
      AND br.request_status = 'pending'
    ORDER BY br.created_at ASC
    `,
        [staffId]
    );

    return result.rows.map((row) => ({
        bookingRequestId: row.booking_request_id,
        bookingDetailId: row.booking_detail_id,
        requestStatus: row.request_status,
        createdAt: row.created_at,
        facility: {
            facilityId: row.facility_id,
            name: row.facility_name,
        },
        bookingDate: row.date.toISOString().slice(0, 10),
        startTime: row.start_time,
        endTime: row.end_time,
        intendedActivity: row.intended_activity,
        member: {
            memberId: row.member_id,
            firstName: row.member_first_name,
            lastName: row.member_last_name,
            email: row.member_email,
        },
    }));
};

/**
 * Unified Conflict Detection Function
 * @param {number} bookingRequestId
 * @param {number} staffId - staff_id
 * @returns {Object} { errors: string[], requestDetail: Object }
 */
const checkBookingConflict = async (bookingRequestId, staffId) => {
    const errors = [];

    // 1. Query request details
    const detailResult = await pool.query(
        `
    SELECT
      br.booking_request_id,
      br.request_status,
      bd.booking_detail_id,
      bd.facility_id,
      bd.date,
      bd.start_time,
      bd.end_time,
      bd.intended_activity,
      bd.member_id,
      f.name AS facility_name,
      f.max_people,
      u.account_status AS member_account_status,
      u.first_name AS member_first_name,
      u.last_name AS member_last_name
    FROM public.booking_requests br
    JOIN public.booking_details bd ON br.booking_detail_id = bd.booking_detail_id
    JOIN public.facilities f ON bd.facility_id = f.facility_id
    JOIN public.members m ON bd.member_id = m.member_id
    JOIN public.users u ON m.user_id = u.id
    WHERE br.booking_request_id = $1
    `,
        [bookingRequestId]
    );

    if (detailResult.rows.length === 0) {
        errors.push('REQUEST_NOT_FOUND');
        return { errors, requestDetail: null };
    }

    const detail = detailResult.rows[0];

    // 2. must be pending
    if (detail.request_status !== 'pending') {
        errors.push('REQUEST_ALREADY_PROCESSED');
    }

    // 3. The employee must be in charge of this venue
    const staffFacilityResult = await pool.query(
        `SELECT staff_facility_id FROM public.staff_facilities
     WHERE staff_id = $1 AND facility_id = $2`,
        [staffId, detail.facility_id]
    );
    if (staffFacilityResult.rows.length === 0) {
        errors.push('STAFF_NOT_AUTHORIZED');
    }

    // 4. The member account must be active
    if (detail.member_account_status !== 'active') {
        errors.push('MEMBER_INACTIVE');
    }

    // 5. Time slot capacity check
    // new_start < existing_end AND new_end > existing_start
    const occupancyResult = await pool.query(
        `
    SELECT COUNT(*) AS occupied_count
    FROM public.bookings b
    JOIN public.booking_details bd ON b.booking_detail_id = bd.booking_detail_id
    WHERE bd.facility_id = $1
      AND bd.date = $2
      AND bd.start_time < $4
      AND bd.end_time > $3
      AND b.booking_status != 'cancelled'
    `,
        [detail.facility_id, detail.date, detail.start_time, detail.end_time]
    );
    const occupied = parseInt(occupancyResult.rows[0].occupied_count, 10);
    if (occupied >= detail.max_people) {
        errors.push('CAPACITY_EXCEEDED');
    }

    return {
        errors,
        requestDetail: {
            bookingRequestId: detail.booking_request_id,
            bookingDetailId: detail.booking_detail_id,
            facilityId: detail.facility_id,
            facilityName: detail.facility_name,
            maxPeople: detail.max_people,
            date: detail.date,
            startTime: detail.start_time,
            endTime: detail.end_time,
            intendedActivity: detail.intended_activity,
            memberId: detail.member_id,
            memberFirstName: detail.member_first_name,
            memberLastName: detail.member_last_name,
            currentOccupied: occupied,
        },
    };
};

/**
 * Staff approves reservation request
 * @param {number} bookingRequestId
 * @param {string} userId - user_id
 * @returns {Object} result
 */
const approveRequest = async (bookingRequestId, userId) => {
    // 1. find staff_id
    const staffResult = await pool.query(
        `SELECT staff_id FROM public.staff WHERE user_id = $1`,
        [userId]
    );
    if (staffResult.rows.length === 0) {
        throw new Error('STAFF_NOT_FOUND');
    }
    const staffId = staffResult.rows[0].staff_id;

    // 2. Conflict detection
    const { errors, requestDetail } = await checkBookingConflict(bookingRequestId, staffId);
    if (errors.length > 0) {
        const err = new Error('CONFLICT');
        err.conflicts = errors;
        err.detail = requestDetail;
        throw err;
    }

    // 3. update booking_requests.status = 'approved'
    await pool.query(
        `UPDATE public.booking_requests
     SET request_status = 'approved'
     WHERE booking_request_id = $1`,
        [bookingRequestId]
    );

    // 4. Insert a reservation into the bookings table(status = 'upcoming')
    await pool.query(
        `UPDATE public.booking_details
     SET staff_id = $2
     WHERE booking_detail_id = $1`,
        [requestDetail.bookingDetailId, staffId]
    );

    const bookingResult = await pool.query(
        `INSERT INTO public.bookings (booking_detail_id, booking_status)
     VALUES ($1, 'upcoming')
     RETURNING booking_id, booking_status, created_at`,
        [requestDetail.bookingDetailId]
    );

    // 5. Send a notification to the member
    const memberUserResult = await pool.query(
        `SELECT user_id FROM public.members WHERE member_id = $1`,
        [requestDetail.memberId]
    );
    if (memberUserResult.rows.length > 0) {
        const memberUserId = memberUserResult.rows[0].user_id;
        await pool.query(
            `INSERT INTO public.notification_histories (user_id, message, type)
       VALUES ($1, $2, 'booking_approved')`,
            [
                memberUserId,
                `Your booking for ${requestDetail.facilityName} on ${requestDetail.date.toISOString().slice(0, 10)} (${requestDetail.startTime}-${requestDetail.endTime}) has been approved.`,
            ]
        );
    }

    return {
        bookingRequestId,
        bookingId: bookingResult.rows[0].booking_id,
        bookingStatus: bookingResult.rows[0].booking_status,
        message: `Booking approved for ${requestDetail.facilityName}`,
    };
};

/**
 * Staff rejects reservation request
 * @param {number} bookingRequestId
 * @param {string} userId - user_id
 * @param {string} reason - reason
 * @returns {Object} result
 */
const rejectRequest = async (bookingRequestId, userId, reason) => {
    // 1. find staff_id
    const staffResult = await pool.query(
        `SELECT staff_id FROM public.staff WHERE user_id = $1`,
        [userId]
    );
    if (staffResult.rows.length === 0) {
        throw new Error('STAFF_NOT_FOUND');
    }
    const staffId = staffResult.rows[0].staff_id;

    // 2. details
    const detailResult = await pool.query(
        `
    SELECT
      br.booking_request_id,
      br.request_status,
      bd.booking_detail_id,
      bd.facility_id,
      bd.date,
      bd.start_time,
      bd.end_time,
      bd.member_id,
      f.name AS facility_name
    FROM public.booking_requests br
    JOIN public.booking_details bd ON br.booking_detail_id = bd.booking_detail_id
    JOIN public.facilities f ON bd.facility_id = f.facility_id
    WHERE br.booking_request_id = $1
    `,
        [bookingRequestId]
    );

    if (detailResult.rows.length === 0) {
        throw new Error('REQUEST_NOT_FOUND');
    }
    const detail = detailResult.rows[0];

    if (detail.request_status !== 'pending') {
        throw new Error('REQUEST_ALREADY_PROCESSED');
    }

    // 3. Verify that the employee is responsible for this facility
    const sfResult = await pool.query(
        `SELECT staff_facility_id FROM public.staff_facilities
     WHERE staff_id = $1 AND facility_id = $2`,
        [staffId, detail.facility_id]
    );
    if (sfResult.rows.length === 0) {
        throw new Error('STAFF_NOT_AUTHORIZED');
    }

    // 4. update rejected
    await pool.query(
        `UPDATE public.booking_requests
     SET request_status = 'rejected'
     WHERE booking_request_id = $1`,
        [bookingRequestId]
    );

    // 5. record the staff
    await pool.query(
        `UPDATE public.booking_details
     SET staff_id = $2
     WHERE booking_detail_id = $1`,
        [detail.booking_detail_id, staffId]
    );

    // 6. Send a notification to the member
    const memberUserResult = await pool.query(
        `SELECT user_id FROM public.members WHERE member_id = $1`,
        [detail.member_id]
    );
    if (memberUserResult.rows.length > 0) {
        const memberUserId = memberUserResult.rows[0].user_id;
        const rejectMessage = reason
            ? `Your booking for ${detail.facility_name} on ${detail.date.toISOString().slice(0, 10)} has been rejected. Reason: ${reason}`
            : `Your booking for ${detail.facility_name} on ${detail.date.toISOString().slice(0, 10)} has been rejected.`;
        await pool.query(
            `INSERT INTO public.notification_histories (user_id, message, type)
       VALUES ($1, $2, 'booking_rejected')`,
            [memberUserId, rejectMessage]
        );
    }

    return {
        bookingRequestId,
        message: `Booking rejected for ${detail.facility_name}`,
    };
};

/**
 * Retrieve all reservations for a specific member
 * @param {string} userId
 * @returns {Object} { upcoming: [], history: [], pendingRequests: [] }
 */
const getMyBookings = async (userId) => {
    // 1. find member_id
    const memberResult = await pool.query(
        `SELECT member_id FROM public.members WHERE user_id = $1`,
        [userId]
    );
    if (memberResult.rows.length === 0) {
        throw new Error('MEMBER_NOT_FOUND');
    }
    const memberId = memberResult.rows[0].member_id;

    // 2. search all pending booking
    const pendingResult = await pool.query(
        `
    SELECT
      br.booking_request_id,
      br.request_status,
      br.created_at,
      bd.facility_id,
      f.name AS facility_name,
      bd.date,
      TO_CHAR(bd.start_time, 'HH24:MI') AS start_time,
      TO_CHAR(bd.end_time, 'HH24:MI') AS end_time,
      bd.intended_activity
    FROM public.booking_requests br
    JOIN public.booking_details bd ON br.booking_detail_id = bd.booking_detail_id
    JOIN public.facilities f ON bd.facility_id = f.facility_id
    WHERE bd.member_id = $1
      AND br.request_status = 'pending'
    ORDER BY bd.date ASC, bd.start_time ASC
    `,
        [memberId]
    );

    // 3. All booking(upcoming + completed + cancelled)
    const bookingsResult = await pool.query(
        `
    SELECT
      b.booking_id,
      b.booking_status,
      b.created_at,
      br.booking_request_id,
      bd.facility_id,
      f.name AS facility_name,
      bd.date,
      TO_CHAR(bd.start_time, 'HH24:MI') AS start_time,
      TO_CHAR(bd.end_time, 'HH24:MI') AS end_time,
      bd.intended_activity
    FROM public.bookings b
    JOIN public.booking_details bd ON b.booking_detail_id = bd.booking_detail_id
    JOIN public.facilities f ON bd.facility_id = f.facility_id
    LEFT JOIN public.booking_requests br ON br.booking_detail_id = bd.booking_detail_id
    WHERE bd.member_id = $1
    ORDER BY bd.date DESC, bd.start_time DESC
    `,
        [memberId]
    );

    // 4. rejected booking
    const rejectedResult = await pool.query(
        `
    SELECT
      br.booking_request_id,
      br.request_status,
      br.created_at,
      bd.facility_id,
      f.name AS facility_name,
      bd.date,
      TO_CHAR(bd.start_time, 'HH24:MI') AS start_time,
      TO_CHAR(bd.end_time, 'HH24:MI') AS end_time,
      bd.intended_activity
    FROM public.booking_requests br
    JOIN public.booking_details bd ON br.booking_detail_id = bd.booking_detail_id
    JOIN public.facilities f ON bd.facility_id = f.facility_id
    WHERE bd.member_id = $1
      AND br.request_status = 'rejected'
    ORDER BY br.created_at DESC
    `,
        [memberId]
    );

    const upcoming = [];
    const history = [];

    for (const row of bookingsResult.rows) {
        const item = {
            bookingId: row.booking_id,
            bookingRequestId: row.booking_request_id,
            bookingStatus: row.booking_status,
            createdAt: row.created_at,
            facilityId: row.facility_id,
            facilityName: row.facility_name,
            bookingDate: row.date.toISOString().slice(0, 10),
            startTime: row.start_time,
            endTime: row.end_time,
            intendedActivity: row.intended_activity,
        };

        if (row.booking_status === 'upcoming') {
            upcoming.push(item);
        } else {
            history.push(item);
        }
    }

    const pendingRequests = pendingResult.rows.map((row) => ({
        bookingRequestId: row.booking_request_id,
        requestStatus: row.request_status,
        createdAt: row.created_at,
        facilityId: row.facility_id,
        facilityName: row.facility_name,
        bookingDate: row.date.toISOString().slice(0, 10),
        startTime: row.start_time,
        endTime: row.end_time,
        intendedActivity: row.intended_activity,
    }));

    const rejected = rejectedResult.rows.map((row) => ({
        bookingRequestId: row.booking_request_id,
        requestStatus: row.request_status,
        createdAt: row.created_at,
        facilityId: row.facility_id,
        facilityName: row.facility_name,
        bookingDate: row.date.toISOString().slice(0, 10),
        startTime: row.start_time,
        endTime: row.end_time,
        intendedActivity: row.intended_activity,
    }));

    return { upcoming, history, pendingRequests, rejected };
};

/**
 * Member cancels booking
 * @param {number} bookingId
 * @param {string} userId
 */
const cancelBooking = async (bookingId, userId) => {
    // 1. find member_id
    const memberResult = await pool.query(
        `SELECT member_id FROM public.members WHERE user_id = $1`,
        [userId]
    );
    if (memberResult.rows.length === 0) {
        throw new Error('MEMBER_NOT_FOUND');
    }
    const memberId = memberResult.rows[0].member_id;

    // 2. is upcoming?
    const bookingResult = await pool.query(
        `
    SELECT b.booking_id, b.booking_status, bd.member_id,
           bd.facility_id, f.name AS facility_name,
           bd.date, TO_CHAR(bd.start_time, 'HH24:MI') AS start_time,
           TO_CHAR(bd.end_time, 'HH24:MI') AS end_time
    FROM public.bookings b
    JOIN public.booking_details bd ON b.booking_detail_id = bd.booking_detail_id
    JOIN public.facilities f ON bd.facility_id = f.facility_id
    WHERE b.booking_id = $1
    `,
        [bookingId]
    );

    if (bookingResult.rows.length === 0) {
        throw new Error('BOOKING_NOT_FOUND');
    }

    const booking = bookingResult.rows[0];

    if (booking.member_id !== memberId) {
        throw new Error('NOT_YOUR_BOOKING');
    }

    if (booking.booking_status !== 'upcoming') {
        throw new Error('CANNOT_CANCEL');
    }

    // 3. update cancelled
    await pool.query(
        `UPDATE public.bookings SET booking_status = 'cancelled' WHERE booking_id = $1`,
        [bookingId]
    );

    // 4. notification
    await pool.query(
        `INSERT INTO public.notification_histories (user_id, message, type)
     VALUES ($1, $2, 'booking_cancelled')`,
        [
            userId,
            `You have cancelled your booking for ${booking.facility_name} on ${booking.date.toISOString().slice(0, 10)} (${booking.start_time}-${booking.end_time}).`,
        ]
    );

    return {
        bookingId,
        message: `Booking cancelled for ${booking.facility_name}`,
    };
};

/**
 * Retrieve the notification list for a specific user
 * @param {string} userId
 * @returns {Array}
 */
const getNotifications = async (userId) => {
    const result = await pool.query(
        `
    SELECT notif_id, message, is_read, type, sending_at
    FROM public.notification_histories
    WHERE user_id = $1
    ORDER BY sending_at DESC
    LIMIT 50
    `,
        [userId]
    );

    return result.rows.map((row) => ({
        notifId: row.notif_id,
        message: row.message,
        isRead: row.is_read,
        type: row.type,
        sendingAt: row.sending_at,
    }));
};

/**
 * Mark notification as read
 * @param {number} notifId
 * @param {string} userId
 */
const markNotificationRead = async (notifId, userId) => {
    await pool.query(
        `UPDATE public.notification_histories
     SET is_read = TRUE
     WHERE notif_id = $1 AND user_id = $2`,
        [notifId, userId]
    );
    return { notifId, isRead: true };
};

/**
 * Mark all notifications as read
 * @param {string} userId
 */
const markAllNotificationsRead = async (userId) => {
    await pool.query(
        `UPDATE public.notification_histories
     SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
    );
    return { message: 'all notifications marked as read' };
};

module.exports = {
    getAvailableSlots,
    submitBookingRequest,
    getPendingRequestsForStaff,
    approveRequest,
    rejectRequest,
    getMyBookings,
    cancelBooking,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
};