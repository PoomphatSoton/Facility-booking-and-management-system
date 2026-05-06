const { pool } = require('../config/db');

const getMemberIdByUserId = async (userId) => {
  const result = await pool.query(
      `
        SELECT member_id
        FROM public.members
        WHERE user_id = $1
          LIMIT 1
      `,
      [userId]
  );

  if (!result.rows[0]) {
    throw new Error('member profile not found');
  }

  return result.rows[0].member_id;
};

const getPartners = async ({ userId }) => {
  const currentMemberId = await getMemberIdByUserId(userId);

  const result = await pool.query(
      `
        SELECT
          m.member_id,
          u.id AS user_id,
          u.first_name,
          u.last_name,
          u.email,
          COALESCE(ms.sport, msp.sport_preferred, 'Not specified') AS sport,
          COALESCE(ms.skill_level, 'Not specified') AS skill_level,
          'Not specified' AS availability,
          'Not specified' AS preferred_time,
          '' AS bio
        FROM public.members m
               JOIN public.users u ON m.user_id = u.id
               LEFT JOIN LATERAL (
          SELECT sport, skill_level
          FROM public.member_skills
          WHERE member_id = m.member_id
          ORDER BY member_skill_id
            LIMIT 1
      ) ms ON true
          LEFT JOIN LATERAL (
          SELECT sport_preferred
          FROM public.member_sport_preferences
          WHERE member_id = m.member_id
          ORDER BY member_sport_preference_id
          LIMIT 1
          ) msp ON true
        WHERE m.member_id <> $1
          AND u.role = 'member'
        ORDER BY u.first_name, u.last_name
      `,
      [currentMemberId]
  );

  return result.rows;
};

const loadInviterBooking = async ({ senderMemberId, bookingId }) => {
  const result = await pool.query(
      `
      SELECT
        b.booking_id,
        b.booking_status,
        bd.booking_detail_id,
        bd.facility_id,
        bd.date,
        bd.start_time,
        bd.end_time,
        bd.intended_activity,
        bd.staff_id,
        bd.member_id AS owner_member_id,
        f.name AS facility_name,
        f.max_people
      FROM public.bookings b
      JOIN public.booking_details bd ON b.booking_detail_id = bd.booking_detail_id
      JOIN public.facilities f ON bd.facility_id = f.facility_id
      WHERE b.booking_id = $1
      LIMIT 1
    `,
      [bookingId]
  );

  if (!result.rows[0]) {
    throw new Error('booking not found');
  }

  const booking = result.rows[0];

  if (booking.owner_member_id !== senderMemberId) {
    throw new Error('booking does not belong to you');
  }

  if (booking.booking_status !== 'upcoming') {
    throw new Error('only upcoming bookings can be shared');
  }

  return booking;
};

const createMatchRequest = async ({ senderUserId, receiverMemberId, bookingId }) => {
  const senderMemberId = await getMemberIdByUserId(senderUserId);

  if (senderMemberId === receiverMemberId) {
    throw new Error('cannot invite yourself');
  }

  if (bookingId) {
    await loadInviterBooking({ senderMemberId, bookingId });

    const existing = await pool.query(
        `
        SELECT 1 FROM public.matching_requests
        WHERE sender_id = $1 AND receiver_id = $2 AND booking_id = $3
          AND status IN ('pending', 'accepted')
        LIMIT 1
      `,
        [senderMemberId, receiverMemberId, bookingId]
    );
    if (existing.rows[0]) {
      throw new Error('already invited this member to this booking');
    }
  }

  const result = await pool.query(
      `
        INSERT INTO public.matching_requests (sender_id, receiver_id, booking_id, status)
        VALUES ($1, $2, $3, 'pending')
          RETURNING request_matching_id, sender_id, receiver_id, booking_id, status, created_at
      `,
      [senderMemberId, receiverMemberId, bookingId || null]
  );

  return result.rows[0];
};

const getIncomingRequests = async ({ userId }) => {
  const receiverMemberId = await getMemberIdByUserId(userId);

  const result = await pool.query(
      `
      SELECT
        mr.request_matching_id,
        mr.status,
        mr.created_at,
        mr.booking_id,
        sender.user_id AS sender_user_id,
        u.first_name,
        u.last_name,
        u.email,
        bd.date           AS booking_date,
        bd.start_time     AS booking_start_time,
        bd.end_time       AS booking_end_time,
        bd.intended_activity,
        f.name            AS facility_name
      FROM public.matching_requests mr
      JOIN public.members sender ON mr.sender_id = sender.member_id
      JOIN public.users u ON sender.user_id = u.id
      LEFT JOIN public.bookings b ON mr.booking_id = b.booking_id
      LEFT JOIN public.booking_details bd ON b.booking_detail_id = bd.booking_detail_id
      LEFT JOIN public.facilities f ON bd.facility_id = f.facility_id
      WHERE mr.receiver_id = $1
      ORDER BY mr.created_at DESC
    `,
      [receiverMemberId]
  );

  return result.rows;
};


const acceptInvite = async ({ client, request, receiverMemberId }) => {

  const bookingRes = await client.query(
      `
      SELECT
        b.booking_id,
        b.booking_status,
        bd.facility_id,
        bd.date,
        bd.start_time,
        bd.end_time,
        bd.intended_activity,
        bd.staff_id,
        f.max_people
      FROM public.bookings b
      JOIN public.booking_details bd ON b.booking_detail_id = bd.booking_detail_id
      JOIN public.facilities f ON bd.facility_id = f.facility_id
      WHERE b.booking_id = $1
      FOR UPDATE OF b
    `,
      [request.booking_id]
  );

  if (!bookingRes.rows[0]) {
    throw new Error('booking no longer exists');
  }
  const booking = bookingRes.rows[0];

  if (booking.booking_status !== 'upcoming') {
    throw new Error('booking is no longer upcoming');
  }


  const occupancyRes = await client.query(
      `
      SELECT COUNT(*)::int AS occupied
      FROM public.bookings b
      JOIN public.booking_details bd ON b.booking_detail_id = bd.booking_detail_id
      WHERE bd.facility_id = $1
        AND bd.date = $2
        AND bd.start_time < $4
        AND bd.end_time > $3
        AND b.booking_status = 'upcoming'
    `,
      [booking.facility_id, booking.date, booking.start_time, booking.end_time]
  );

  if (occupancyRes.rows[0].occupied >= booking.max_people) {
    throw new Error('facility capacity is full');
  }


  const detailRes = await client.query(
      `
      INSERT INTO public.booking_details
        (facility_id, date, start_time, end_time, intended_activity, member_id, staff_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING booking_detail_id
    `,
      [
        booking.facility_id,
        booking.date,
        booking.start_time,
        booking.end_time,
        `[Joined] ${booking.intended_activity || ''}`.trim(),
        receiverMemberId,
        booking.staff_id,
      ]
  );


  const newBookingRes = await client.query(
      `
      INSERT INTO public.bookings (booking_detail_id, booking_status)
      VALUES ($1, 'upcoming')
      RETURNING booking_id
    `,
      [detailRes.rows[0].booking_detail_id]
  );

  return newBookingRes.rows[0].booking_id;
};

const updateRequestStatus = async ({ userId, requestId, status }) => {
  const allowedStatuses = ['accepted', 'rejected'];
  if (!allowedStatuses.includes(status)) {
    throw new Error('invalid status');
  }

  const receiverMemberId = await getMemberIdByUserId(userId);


  const client = await pool.connect();
  try {
    await client.query('BEGIN');


    const reqRes = await client.query(
        `
        SELECT request_matching_id, sender_id, receiver_id, booking_id, status
        FROM public.matching_requests
        WHERE request_matching_id = $1 AND receiver_id = $2
        FOR UPDATE
      `,
        [requestId, receiverMemberId]
    );

    if (!reqRes.rows[0]) {
      throw new Error('request not found');
    }
    const request = reqRes.rows[0];

    if (request.status !== 'pending') {
      throw new Error('request already handled');
    }

    let newBookingId = null;
    if (status === 'accepted' && request.booking_id) {
      newBookingId = await acceptInvite({ client, request, receiverMemberId });
    }

    const updRes = await client.query(
        `
        UPDATE public.matching_requests
        SET status = $1
        WHERE request_matching_id = $2
        RETURNING request_matching_id, sender_id, receiver_id, booking_id, status, created_at
      `,
        [status, requestId]
    );

    const senderUserRes = await client.query(
        `
        SELECT u.id AS user_id
        FROM public.members m
        JOIN public.users u ON m.user_id = u.id
        WHERE m.member_id = $1
      `,
        [request.sender_id]
    );
    const receiverUserRes = await client.query(
        `
        SELECT u.first_name, u.last_name
        FROM public.members m
        JOIN public.users u ON m.user_id = u.id
        WHERE m.member_id = $1
      `,
        [receiverMemberId]
    );

    if (senderUserRes.rows[0]) {
      const senderUserId = senderUserRes.rows[0].user_id;
      const receiverName = receiverUserRes.rows[0]
          ? `${receiverUserRes.rows[0].first_name || ''} ${receiverUserRes.rows[0].last_name || ''}`.trim() || 'A member'
          : 'A member';
      const message =
          status === 'accepted'
              ? `${receiverName} accepted your partner invite.`
              : `${receiverName} declined your partner invite.`;
      await client.query(
          `
          INSERT INTO public.notification_histories (user_id, message, type)
          VALUES ($1, $2, $3)
        `,
          [senderUserId, message, `partner_invite_${status}`]
      );
    }

    await client.query('COMMIT');
    return { ...updRes.rows[0], joined_booking_id: newBookingId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getPartners,
  createMatchRequest,
  getIncomingRequests,
  updateRequestStatus,
};