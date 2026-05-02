const { pool } = require("../config/db");
const { auth } = require("../config/firebase");

const buildError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const mapAdmin = (row) => ({
  id: String(row.id),
  email: row.email,
  firstName: row.first_name || "",
  lastName: row.last_name || "",
  accountStatus: row.account_status,
  createdAt: row.created_at,
});

const getAllAdmins = async () => {
  const { rows } = await pool.query(
    `SELECT id, email, first_name, last_name, account_status, created_at
     FROM public.users
     WHERE role = 'admin'
     ORDER BY created_at ASC`,
  );
  return rows.map(mapAdmin);
};

const createAdmin = async ({ email, password, firstName, lastName }) => {
  if (!email || !password)
    throw buildError("email and password are required", 400);

  const existing = await pool.query(
    `SELECT id FROM public.users WHERE email = $1`,
    [email.trim().toLowerCase()],
  );
  if (existing.rows.length > 0) throw buildError("email already exists", 409);

  // Create Firebase account
  const firebaseUser = await auth.createUser({ email, password });

  const { rows } = await pool.query(
    `INSERT INTO public.users (email, firebase_uid, first_name, last_name, role, account_status)
     VALUES ($1, $2, $3, $4, 'admin', 'active')
     RETURNING id, email, first_name, last_name, account_status, created_at`,
    [
      email.trim().toLowerCase(),
      firebaseUser.uid,
      firstName?.trim() || null,
      lastName?.trim() || null,
    ],
  );
  return mapAdmin(rows[0]);
};

const updateAdmin = async (adminId, { firstName, lastName, email }) => {
  const { rows } = await pool.query(
    `UPDATE public.users
     SET first_name = $1, last_name = $2, email = COALESCE($3, email)
     WHERE id = $4 AND role = 'admin'
     RETURNING id, email, first_name, last_name, account_status, created_at`,
    [
      firstName?.trim() || null,
      lastName?.trim() || null,
      email ? email.trim().toLowerCase() : null,
      adminId,
    ],
  );
  if (rows.length === 0) throw buildError("admin not found", 404);
  return mapAdmin(rows[0]);
};

const ROOT_ADMIN_EMAIL = "admin@sport.com";

const deleteAdmin = async (adminId) => {
  const { rows: check } = await pool.query(
    `SELECT email FROM public.users WHERE id = $1`,
    [adminId],
  );
  if (check[0]?.email === ROOT_ADMIN_EMAIL) {
    throw buildError("root admin account cannot be deleted", 403);
  }

  const { rows } = await pool.query(
    `DELETE FROM public.users WHERE id = $1 AND role = 'admin' RETURNING id, firebase_uid`,
    [adminId],
  );
  if (rows.length === 0) throw buildError("admin not found", 404);

  if (rows[0].firebase_uid) {
    await auth.deleteUser(rows[0].firebase_uid).catch(() => {});
  }
};

const seedRootAdmin = async () => {
  const email = ROOT_ADMIN_EMAIL;
  const password = "123456";

  const { rows } = await pool.query(
    `SELECT id FROM public.users WHERE email = $1`,
    [email],
  );

  if (rows.length > 0) {
    return;
  }

  let firebaseUid = null;
  try {
    const firebaseUser = await auth.createUser({ email, password });
    firebaseUid = firebaseUser.uid;
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      const existing = await auth.getUserByEmail(email);
      firebaseUid = existing.uid;
    } else {
      throw err;
    }
  }

  await pool.query(
    `INSERT INTO public.users (email, firebase_uid, first_name, last_name, role, account_status)
     VALUES ($1, $2, 'Root', 'Admin', 'admin', 'active')`,
    [email, firebaseUid],
  );
};

module.exports = {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  seedRootAdmin,
};
