const { auth } = require("../config/firebase");
const userStore = require("../store/user.store");

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  console.log("Authorization header:");
  if (scheme !== "Bearer" || !token) {
    console.log("Missing or invalid Authorization header");
    return res.status(401).json({ message: "missing or invalid token" });
  }

  try {
    // const token2 = await auth.user.getIdToken(true);
    console.log("Decoded token:", token);
    console.log("isSame:");
    console.log("Verifying token with Firebase");
    const decoded = await auth.verifyIdToken(token);
    console.log("Decoded token:", decoded);
    if (!decoded.email_verified) {
      return res.status(403).json({ message: "email is not verified" });
    }
    const user = await userStore.findByFirebaseUid(decoded.uid);

    if (!user) {
      return res.status(401).json({ message: "user not registered in system" });
    }

    if (user.accountStatus === "suspended") {
      return res.status(403).json({ message: "account is suspended" });
    }

    req.user = {
      id: user.id,
      firebaseUid: user.firebaseUid,
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
    return res.status(401).json({ message: "token is invalid or expired" });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: "authentication required" });
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: `forbidden: requires role ${allowedRoles.join(" or ")}`,
        });
    }
    return next();
  };
};

module.exports = { requireAuth, requireRole };
