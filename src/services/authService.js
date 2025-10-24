const bcrypt = require("bcryptjs");
const { createSession } = require("../utils/sessionAuth");

async function loginUser(req, username, password) {
  const db = req.app.get("db");
  const user = await db.User.findOne({ where: { id: username } });
  if (!user) throw new Error("사용자 없음");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("비밀번호 불일치");

  await createSession(req, user);

  return { id: user.id, username: user.id };
}

async function logoutUser(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function signupUser(req, {
  full_name,
  phone_number,
  email,
  hire_date,
  position,
  department,
  role,
  username,
  password,
}) {
  const db = req.app.get("db");

  const userProfile = await db.UserProfile.create({
    full_name,
    phone_number,
    email,
    hire_date: hire_date || null,
    position: position || null,
    department: department || null,
    role: role || 1, // 기본값: 1 (직원)
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.User.create({
    id: username,
    password: hashedPassword,
    profile_id: userProfile.id,
  });

  return user;
}

async function getAllUsers(req) {
  const db = req.app.get("db");
  const users = await db.User.findAll();
  return users;
}

async function getUserById(req, id) {
  const db = req.app.get("db");
  const user = await db.User.findByPk(id, {
    include: [
      {
        model: db.UserProfile,
        as: "UserProfile",
      },
    ],
  });
  return user;
}

async function updateUser(req, id, {
  full_name,
  phone_number,
  email,
  hire_date,
  position,
  department,
  role,
}) {
  const db = req.app.get("db");
  const user = await db.User.findByPk(id, { include: db.UserProfile });
  if (!user) throw new Error("사용자 없음");

  if (user.UserProfile) {
    await user.UserProfile.update({
      full_name,
      phone_number,
      email,
      hire_date,
      position,
      department,
      role,
    });
  }

  return user;
}

async function deleteUser(req, id) {
  const db = req.app.get("db");
  const user = await db.User.findByPk(id);
  if (!user) throw new Error("사용자 없음");
  await user.destroy();
  return user;
}

module.exports = {
  loginUser,
  logoutUser,
  signupUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
