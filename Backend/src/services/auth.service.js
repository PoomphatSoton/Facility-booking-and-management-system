const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpMailService = require('./otp-mail.service');
const userStore = require('../store/user.store');

const INVALID_CREDENTIALS_MESSAGE = 'Invalid username or password.';

const buildError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const assertRequiredFields = (payload, requiredFields, message) => {
  const hasMissingField = requiredFields.some((field) => !payload[field]);
  if (hasMissingField) {
    throw buildError(message, 400);
  }
};

const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  dateOfBirth: user.dateOfBirth || '',
  address: user.address || '',
});

const isProfileIncomplete = (user) =>
  !user.firstName || !user.lastName || !user.dateOfBirth || !user.address;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const createUserToken = (user) =>
  jwt.sign({ kind: 'user', sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

const createPasswordResetToken = (user) =>
  jwt.sign({ kind: 'password-reset', sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

const validateRegisterInput = ({ email, password }) => {
  assertRequiredFields({ email, password }, ['email', 'password'], 'email and password are required');
};

const validateRegisterOtpInput = ({ registrationId, otp }) => {
  assertRequiredFields(
    { registrationId, otp },
    ['registrationId', 'otp'],
    'registrationId and otp are required'
  );
};

const validateRegisterDetailsInput = ({ firstName, lastName, dateOfBirth, address }) => {
  assertRequiredFields(
    { firstName, lastName, dateOfBirth, address },
    ['firstName', 'lastName', 'dateOfBirth', 'address'],
    'firstName, lastName, dateOfBirth, and address are required'
  );
};

const validateLoginInput = ({ email, password }) => {
  assertRequiredFields({ email, password }, ['email', 'password'], 'email and password are required');
};

const validateForgotPasswordRequestInput = ({ email }) => {
  assertRequiredFields({ email }, ['email'], 'email is required');
};

const validateForgotPasswordVerifyInput = ({ resetRequestId, otp }) => {
  assertRequiredFields(
    { resetRequestId, otp },
    ['resetRequestId', 'otp'],
    'resetRequestId and otp are required'
  );
};

const validateForgotPasswordResetInput = ({ resetToken, newPassword }) => {
  assertRequiredFields(
    { resetToken, newPassword },
    ['resetToken', 'newPassword'],
    'resetToken and newPassword are required'
  );
};

const registerCredentials = async ({ email, password }) => {
  validateRegisterInput({ email, password });

  const existingUser = await userStore.findByEmail(email);
  if (existingUser) {
    throw buildError('email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const existingPending = await userStore.findPendingByEmail(email);
  const pending = existingPending
    ? await userStore.updatePendingRegistration(existingPending.registrationId, {
        otp,
      })
    : await userStore.createPendingRegistration({ email, passwordHash, otp });

  await otpMailService.sendOtpEmail({ email: pending.email, otp: pending.otp });

  return {
    registrationId: pending.registrationId,
    nextStep: 'otp',
    message: 'OTP has been generated and sent',
  };
};

const resendOtp = async ({ registrationId }) => {
  if (!registrationId) {
    throw buildError('registrationId is required', 400);
  }

  const pending = await userStore.findPendingByRegistrationId(registrationId);
  if (!pending) {
    throw buildError('pending registration not found', 404);
  }

  const otp = generateOtp();
  await userStore.updatePendingRegistration(registrationId, { otp });
  await otpMailService.sendOtpEmail({ email: pending.email, otp });

  return {
    registrationId,
    message: 'OTP has been resent',
  };
};

const verifyRegisterOtp = async ({ registrationId, otp }) => {
  validateRegisterOtpInput({ registrationId, otp });

  const pending = await userStore.findPendingByRegistrationId(registrationId);
  if (!pending) {
    throw buildError('pending registration not found', 404);
  }
  if (pending.otp !== String(otp)) {
    throw buildError('invalid otp', 400);
  }

  const user = await userStore.create({
    email: pending.email,
    passwordHash: pending.passwordHash,
    firstName: null,
    lastName: null,
    dateOfBirth: null,
    address: null,
  });
  await userStore.removePendingByRegistrationId(registrationId);
  const token = createUserToken(user);

  return {
    registrationId,
    nextStep: 'details',
    message: 'OTP verified',
    token,
  };
};

const completeRegisterDetails = async ({ firstName, lastName, dateOfBirth, address, userId }) => {
  validateRegisterDetailsInput({ firstName, lastName, dateOfBirth, address });

  const user = await userStore.updateProfileById(userId, {
    firstName,
    lastName,
    dateOfBirth,
    address,
  });

  if (!user) {
    throw buildError('user not found', 404);
  }

  return {
    user: toPublicUser(user),
  };
};

const login = async ({ email, password }) => {
  validateLoginInput({ email, password });

  const user = await userStore.findByEmail(email);
  if (!user) {
    throw buildError(INVALID_CREDENTIALS_MESSAGE, 401);
  }

  const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordMatch) {
    throw buildError(INVALID_CREDENTIALS_MESSAGE, 401);
  }

  const token = createUserToken(user);
  const publicUser = toPublicUser(user);
  const isIncomplete = isProfileIncomplete(user);

  return {
    token,
    user: publicUser,
    ...(isIncomplete
      ? {
          nextStep: 'details',
        }
      : {}),
  };
};

const getSessionStatus = async ({ authToken }) => {
  const token = authToken;
  if (!token) {
    return { isLoggedIn: false, isPendingStep3: false, user: null };
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.kind === 'user' && payload.sub) {
      const user = await userStore.findById(payload.sub);
      if (!user) {
        return { isLoggedIn: false, isPendingStep3: false, user: null };
      }

      const pendingStep3 = isProfileIncomplete(user);

      return {
        isLoggedIn: true,
        isPendingStep3: pendingStep3,
        user: toPublicUser(user),
      };
    }

    return { isLoggedIn: false, isPendingStep3: false, user: null };
  } catch {
    return { isLoggedIn: false, isPendingStep3: false, user: null };
  }
};

const forgotPasswordRequest = async ({ email }) => {
  validateForgotPasswordRequestInput({ email });

  const user = await userStore.findByEmail(email);
  if (!user) {
    throw buildError('user not found', 404);
  }

  const otp = generateOtp();
  const existingPending = await userStore.findPendingPasswordResetByEmail(user.email);
  const pending = existingPending
    ? await userStore.updatePendingPasswordReset(existingPending.resetRequestId, { otp })
    : await userStore.createPendingPasswordReset({
        userId: user.id,
        email: user.email,
        otp,
      });

  await otpMailService.sendOtpEmail({ email: pending.email, otp: pending.otp });

  return {
    resetRequestId: pending.resetRequestId,
    message: 'OTP has been generated and sent',
  };
};

const forgotPasswordResendOtp = async ({ resetRequestId }) => {
  if (!resetRequestId) {
    throw buildError('resetRequestId is required', 400);
  }

  const pending = await userStore.findPendingPasswordResetByRequestId(resetRequestId);
  if (!pending) {
    throw buildError('pending password reset not found', 404);
  }

  const otp = generateOtp();
  await userStore.updatePendingPasswordReset(resetRequestId, { otp });
  await otpMailService.sendOtpEmail({ email: pending.email, otp });

  return {
    message: 'OTP has been resent',
  };
};

const forgotPasswordVerify = async ({ resetRequestId, otp }) => {
  validateForgotPasswordVerifyInput({ resetRequestId, otp });

  const pending = await userStore.findPendingPasswordResetByRequestId(resetRequestId);
  if (!pending) {
    throw buildError('pending password reset not found', 404);
  }
  if (pending.otp !== String(otp)) {
    throw buildError('invalid otp', 400);
  }

  const resetToken = createPasswordResetToken({
    id: pending.userId,
    email: pending.email,
  });
  await userStore.removePendingPasswordResetByRequestId(resetRequestId);

  return {
    resetToken,
    message: 'OTP verified',
  };
};

const forgotPasswordReset = async ({ resetToken, newPassword }) => {
  validateForgotPasswordResetInput({ resetToken, newPassword });

  let payload;
  try {
    payload = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    throw buildError('invalid or expired reset token', 401);
  }

  if (payload.kind !== 'password-reset' || !payload.sub) {
    throw buildError('invalid reset token', 401);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const user = await userStore.updatePasswordById(payload.sub, passwordHash);
  if (!user) {
    throw buildError('user not found', 404);
  }

  return {
    message: 'Password has been reset successfully',
  };
};

module.exports = {
  registerCredentials,
  resendOtp,
  verifyRegisterOtp,
  completeRegisterDetails,
  login,
  getSessionStatus,
  forgotPasswordRequest,
  forgotPasswordVerify,
  forgotPasswordReset,
  forgotPasswordResendOtp,
};
