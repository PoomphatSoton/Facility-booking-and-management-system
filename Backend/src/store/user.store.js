const { randomUUID } = require('crypto');
const { pool } = require('../config/db');

const mapUser = (row) => ({
  id: String(row.id),
  email: row.email,
  passwordHash: row.password_hash,
  firstName: row.first_name,
  lastName: row.last_name,
  dateOfBirth: row.date_of_birth,
  address: row.address,
});

const mapPending = (row) => ({
  registrationId: row.registration_id,
  email: row.email,
  passwordHash: row.password_hash,
  otp: row.otp,
  otpVerified: row.otp_verified,
});

const toNullableTrimmedText = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value).trim();
};

const createPendingRegistration = async ({ email, passwordHash, otp }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const registrationId = `reg_${randomUUID()}`;

  const { rows } = await pool.query(
    `
      INSERT INTO public.pending_registrations (registration_id, email, password_hash, otp, otp_verified)
      VALUES ($1, $2, $3, $4, FALSE)
      RETURNING registration_id, email, password_hash, otp, otp_verified
    `,
    [registrationId, normalizedEmail, passwordHash, String(otp)]
  );

  return mapPending(rows[0]);
};

const findPendingByEmail = async (email) => {
  if (!email) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await pool.query(
    `
      SELECT registration_id, email, password_hash, otp, otp_verified
      FROM public.pending_registrations
      WHERE email = $1
      LIMIT 1
    `,
    [normalizedEmail]
  );

  return rows[0] ? mapPending(rows[0]) : null;
};

const findPendingByRegistrationId = async (registrationId) => {
  const { rows } = await pool.query(
    `
      SELECT registration_id, email, password_hash, otp, otp_verified
      FROM public.pending_registrations
      WHERE registration_id = $1
      LIMIT 1
    `,
    [registrationId]
  );

  return rows[0] ? mapPending(rows[0]) : null;
};

const markOtpVerified = async (registrationId) => {
  const { rows } = await pool.query(
    `
      UPDATE public.pending_registrations
      SET otp_verified = TRUE
      WHERE registration_id = $1
      RETURNING registration_id, email, password_hash, otp, otp_verified
    `,
    [registrationId]
  );

  return rows[0] ? mapPending(rows[0]) : null;
};

const updatePendingRegistration = async (registrationId, updates) => {
  const pending = await findPendingByRegistrationId(registrationId);
  if (!pending) {
    return null;
  }

  const nextOtp = updates.otp !== undefined ? String(updates.otp) : pending.otp;
  const nextOtpVerified =
    updates.otpVerified !== undefined ? Boolean(updates.otpVerified) : pending.otpVerified;

  const { rows } = await pool.query(
    `
      UPDATE public.pending_registrations
      SET otp = $2, otp_verified = $3
      WHERE registration_id = $1
      RETURNING registration_id, email, password_hash, otp, otp_verified
    `,
    [registrationId, nextOtp, nextOtpVerified]
  );

  return rows[0] ? mapPending(rows[0]) : null;
};

const removePendingByRegistrationId = async (registrationId) => {
  await pool.query('DELETE FROM public.pending_registrations WHERE registration_id = $1', [registrationId]);
};

const create = async ({ email, passwordHash, firstName, lastName, dateOfBirth, address }) => {
  const normalizedEmail = email.trim().toLowerCase();
  console.log("Email = ", email)
  const { rows } = await pool.query(
    `
      INSERT INTO public.users (email, password_hash, first_name, last_name, date_of_birth, address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, password_hash, first_name, last_name, date_of_birth, address
    `,
    [
      normalizedEmail,
      passwordHash,
      toNullableTrimmedText(firstName),
      toNullableTrimmedText(lastName),
      dateOfBirth,
      toNullableTrimmedText(address),
    ]
  );

  return mapUser(rows[0]);
};

const findByEmail = async (email) => {
  if (!email) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await pool.query(
    `
      SELECT id, email, password_hash, first_name, last_name, date_of_birth, address
      FROM public.users
      WHERE email = $1
      LIMIT 1
    `,
    [normalizedEmail]
  );
  console.log("findByEmail rows = ", rows)
  return rows[0] ? mapUser(rows[0]) : null;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `
      SELECT id, email, password_hash, first_name, last_name, date_of_birth, address
      FROM public.users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return rows[0] ? mapUser(rows[0]) : null;
};

const updateProfileById = async (id, { firstName, lastName, dateOfBirth, address }) => {
  const { rows } = await pool.query(
    `
      UPDATE public.users
      SET first_name = $2,
          last_name = $3,
          date_of_birth = $4,
          address = $5
      WHERE id = $1
      RETURNING id, email, password_hash, first_name, last_name, date_of_birth, address
    `,
    [
      id,
      toNullableTrimmedText(firstName),
      toNullableTrimmedText(lastName),
      dateOfBirth,
      toNullableTrimmedText(address),
    ]
  );

  return rows[0] ? mapUser(rows[0]) : null;
};

const reset = async () => {
  await pool.query('TRUNCATE TABLE public.pending_registrations, public.users RESTART IDENTITY CASCADE');
};

module.exports = {
  create,
  createPendingRegistration,
  findByEmail,
  findById,
  findPendingByEmail,
  findPendingByRegistrationId,
  markOtpVerified,
  updatePendingRegistration,
  updateProfileById,
  removePendingByRegistrationId,
  reset,
};
