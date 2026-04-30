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

const createMatchRequest = async ({ senderUserId, receiverMemberId }) => {
  const senderMemberId = await getMemberIdByUserId(senderUserId);

  const result = await pool.query(
    `
      INSERT INTO public.matching_requests (sender_id, receiver_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING request_matching_id, sender_id, receiver_id, status, created_at
    `,
    [senderMemberId, receiverMemberId]
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
        sender.user_id AS sender_user_id,
        u.first_name,
        u.last_name,
        u.email
      FROM public.matching_requests mr
      JOIN public.members sender ON mr.sender_id = sender.member_id
      JOIN public.users u ON sender.user_id = u.id
      WHERE mr.receiver_id = $1
      ORDER BY mr.created_at DESC
    `,
    [receiverMemberId]
  );

  return result.rows;
};

const updateRequestStatus = async ({ userId, requestId, status }) => {
  const allowedStatuses = ['accepted', 'rejected'];

  if (!allowedStatuses.includes(status)) {
    throw new Error('invalid status');
  }

  const receiverMemberId = await getMemberIdByUserId(userId);

  const result = await pool.query(
    `
      UPDATE public.matching_requests
      SET status = $1
      WHERE request_matching_id = $2
        AND receiver_id = $3
      RETURNING request_matching_id, sender_id, receiver_id, status, created_at
    `,
    [status, requestId, receiverMemberId]
  );

  if (!result.rows[0]) {
    throw new Error('request not found');
  }

  return result.rows[0];
};

module.exports = {
  createMatchRequest,
  getIncomingRequests,
  updateRequestStatus,
};