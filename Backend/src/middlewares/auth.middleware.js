const jwt = require('jsonwebtoken');
const userStore = require('../store/user.store');

const requireAuth = async (req, res, next) => {
  const cookieToken = req.cookies?.authToken;
  const authHeader = req.headers.authorization || '';
  const [scheme, headerToken] = authHeader.split(' ');
  const token = cookieToken || (scheme === 'Bearer' ? headerToken : '');

  if (!token) {
    return res.status(401).json({ message: 'missing or invalid token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userStore.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: 'user no longer exists' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      role: user.role,
      accountStatus: user.accountStatus,
    };

    return next();
  } catch {
    return res.status(401).json({ message: 'token is invalid or expired' });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `forbidden: requires role ${allowedRoles.join(' or ')}`
      });
    }
    return next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
};
