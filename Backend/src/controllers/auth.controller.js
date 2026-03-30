const authService = require('../services/auth.service');
const AUTH_COOKIE_NAME = 'authToken';

const buildAuthCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 1000,
});

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, buildAuthCookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
};

const formatErrorResponse = (error, fallbackMessage) => ({
  message: error.message || fallbackMessage,
  nextStep: error.nextStep,
  state: error.state,
  registrationId: error.registrationId,
});

const registerCredentials = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.registerCredentials({ email, password });
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json(formatErrorResponse(error, 'Register credentials failed'));
  }
};

const verifyRegisterOtp = async (req, res) => {
  try {
    const { registrationId, otp } = req.body;
    const result = await authService.verifyRegisterOtp({ registrationId, otp });
    setAuthCookie(res, result.token);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json(formatErrorResponse(error, 'OTP verification failed'));
  }
};

const completeRegisterDetails = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, address } = req.body;
    const result = await authService.completeRegisterDetails({
      firstName,
      lastName,
      dateOfBirth,
      address,
      userId: req.user.id,
    });
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json(formatErrorResponse(error, 'Register details failed'));
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    setAuthCookie(res, result.token);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 401).json(formatErrorResponse(error, 'Login failed'));
  }
};

const logout = async (_req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: 'Logout successful' });
};

const me = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

const sessionStatus = async (req, res) => {
  const result = await authService.getSessionStatus({
    authToken: req.cookies?.[AUTH_COOKIE_NAME],
  });
  return res.status(200).json(result);
};

module.exports = {
  registerCredentials,
  verifyRegisterOtp,
  completeRegisterDetails,
  login,
  logout,
  me,
  sessionStatus,
};
