const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpMailService = require('./otp-mail.service');
const userStore = require('../store/user.store');

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const createUserToken = (user) =>
  jwt.sign({ kind: 'user', sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

const createPendingToken = ({ registrationId, email }) =>
  jwt.sign(
    { kind: 'pending', registrationId, email },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
    }
  );

const validateRegisterCredentialsInput = ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('email and password are required');
    error.statusCode = 400;
    throw error;
  }
};

const validateRegisterOtpInput = ({ registrationId, otp }) => {
  if (!registrationId || !otp) {
    const error = new Error('registrationId and otp are required');
    error.statusCode = 400;
    throw error;
  }
};

const validateRegisterDetailsInput = ({ firstName, lastName, dateOfBirth, address }) => {
  if (!firstName || !lastName || !dateOfBirth || !address) {
    const error = new Error('firstName, lastName, dateOfBirth, and address are required');
    error.statusCode = 400;
    throw error;
  }
};

const resolveRegistrationIdFromInputOrToken = ({ registrationId, authHeader }) => {
  if (registrationId) {
    return registrationId;
  }

  const [scheme, token] = (authHeader || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    const error = new Error('registrationId is required');
    error.statusCode = 400;
    throw error;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.kind !== 'pending' || !payload.registrationId) {
      const error = new Error('registrationId is required');
      error.statusCode = 400;
      throw error;
    }

    return payload.registrationId;
  } catch {
    const error = new Error('token is invalid or expired');
    error.statusCode = 401;
    throw error;
  }
};

const validateLoginInput = ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('email and password are required');
    error.statusCode = 400;
    throw error;
  }
};

const registerCredentials = async ({ email, password }) => {
  validateRegisterCredentialsInput({ email, password });

  const existingUser = await userStore.findByEmail(email);
  if (existingUser) {
    const error = new Error('email already exists');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  let pending;
  let resumed = false;

  try {
    pending = await userStore.createPendingRegistration({ email, passwordHash, otp });
  } catch (dbError) {
    if (dbError.code === '23505') {
      const existingPending = await userStore.findPendingByEmail(email);
      if (!existingPending) {
        throw dbError;
      }

      pending = await userStore.updatePendingRegistration(existingPending.registrationId, {
        otp,
        otpVerified: false,
      });
      resumed = true;

      if (!pending) {
        throw dbError;
      }
    } else {
      throw dbError;
    }
  }

  const delivery = await otpMailService.sendOtpEmail({ email: pending.email, otp: pending.otp });

  return {
    registrationId: pending.registrationId,
    nextStep: 'otp',
    resumed,
    message: 'OTP has been generated and sent',
    delivery,
  };
};

const verifyRegisterOtp = async ({ registrationId, otp }) => {
  validateRegisterOtpInput({ registrationId, otp });

  const pending = await userStore.findPendingByRegistrationId(registrationId);
  if (!pending) {
    const error = new Error('pending registration not found');
    error.statusCode = 404;
    error.nextStep = 'credentials';
    error.state = 'credentials';
    throw error;
  }
  if (pending.otp !== String(otp)) {
    const error = new Error('invalid otp');
    error.statusCode = 400;
    throw error;
  }

  await userStore.markOtpVerified(registrationId);
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
  if (!userId) {
    const error = new Error('authorization token is required');
    error.statusCode = 401;
    throw error;
  }

  const user = await userStore.updateProfileById(userId, {
    firstName,
    lastName,
    dateOfBirth,
    address,
  });

  if (!user) {
    const error = new Error('user not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
    },
  };
};

const login = async ({ email, password }) => {
  validateLoginInput({ email, password });

  const user = await userStore.findByEmail(email);
  console.log("user = ", user)
  if (user) {
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      const error = new Error('invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const token = createUserToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
      },
    };
  }

  const pending = await userStore.findPendingByEmail(email);
  if (!pending) {
    const error = new Error('invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordMatch = await bcrypt.compare(password, pending.passwordHash);
  if (!isPasswordMatch) {
    const error = new Error('invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  if (!pending.otpVerified) {
    const error = new Error('otp must be verified first');
    error.statusCode = 409;
    error.nextStep = 'otp';
    error.state = 'otp';
    error.registrationId = pending.registrationId;
    throw error;
  }

  return {
    token: createPendingToken({ registrationId: pending.registrationId, email: pending.email }),
    nextStep: 'details',
    registrationId: pending.registrationId,
    message: 'Registration is incomplete. Please complete your profile details.',
  };
};

const getSessionStatus = async ({ authToken }) => {
  const token = authToken;
  if (!token) {
    return { isLoggedIn: false, isPendingStep3: false, user: null };
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.kind === 'pending') {
      return { isLoggedIn: false, isPendingStep3: true, user: null };
    }

    if (payload.kind === 'user' && payload.sub) {
      const user = await userStore.findById(payload.sub);
      if (!user) {
        return { isLoggedIn: false, isPendingStep3: false, user: null };
      }

      return {
        isLoggedIn: true,
        isPendingStep3: false,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth,
          address: user.address,
        },
      };
    }

    return { isLoggedIn: false, isPendingStep3: false, user: null };
  } catch {
    return { isLoggedIn: false, isPendingStep3: false, user: null };
  }
};

module.exports = {
  registerCredentials,
  verifyRegisterOtp,
  completeRegisterDetails,
  login,
  getSessionStatus,
};
