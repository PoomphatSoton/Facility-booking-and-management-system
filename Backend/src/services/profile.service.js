const userStore = require("../store/user.store");

const buildError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const userModel = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName || "",
  lastName: user.lastName || "",
  dateOfBirth: user.dateOfBirth || "",
  address: user.address || "",
  role: user.role || "member",
});

const getProfile = async ({ userId }) => {
  const user = await userStore.findById(userId);
  if (!user) {
    throw buildError("user not found", 404);
  }
  return { user: userModel(user) };
};

const updateProfile = async ({
  userId,
  firstName,
  lastName,
  dateOfBirth,
  address,
}) => {
  const user = await userStore.updateProfileById(userId, {
    firstName,
    lastName,
    dateOfBirth: dateOfBirth || null,
    address,
  });
  if (!user) {
    throw buildError("user not found", 404);
  }
  return { user: userModel(user) };
};

module.exports = { getProfile, updateProfile };
