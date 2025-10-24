const { 
  loginUser, 
  logoutUser, 
  signupUser, 
  getAllUsers: getAllUsersService, 
  getUserById: getUserByIdService, 
  updateUser: updateUserService, 
  deleteUser: deleteUserService 
} = require("../services/authService");

async function login(req, res) {
  try {
    const { username, password } = req.body;
    const user = await loginUser(req, username, password);
    res.json({ message: "로그인 성공", user });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
}

async function logout(req, res) {
  try {
    await logoutUser(req);
    res.clearCookie("connect.sid");
    res.json({ message: "로그아웃 성공" });
  } catch (err) {
    res.status(500).json({ message: "로그아웃 실패" });
  }
}

async function getMe(req, res) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "인증 필요" });
    }
    
    const user = await getUserByIdService(req, userId);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
    }
    
    res.json({ 
      message: "사용자 정보 조회 성공", 
      user: {
        id: user.id,
        profile: user.UserProfile
      }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function signup(req, res) {
  try {
    const {
      full_name,
      phone_number,
      email,
      hire_date,
      position,
      department,
      role,
      username,
      password,
    } = req.body;

    // signupUser가 model context에 맞는 인자들을 받도록 수정
    const user = await signupUser(req, {
      full_name,
      phone_number,
      email,
      hire_date,
      position,
      department,
      role,
      username,
      password,
    });
    res.json({ message: "회원가입 성공", user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await getAllUsersService(req);
    res.json({ message: "모든 사용자 조회 성공", users });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(req, id);
    res.json({ message: "사용자 조회 성공", user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const {
      full_name,
      phone_number,
      email,
      hire_date,
      position,
      department,
      role,
    } = req.body;
    const user = await updateUserService(req, id, {
      full_name,
      phone_number,
      email,
      hire_date,
      position,
      department,
      role,
    });
    res.json({ message: "사용자 업데이트 성공", user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    await deleteUserService(req, id);
    res.json({ message: "사용자 삭제 성공" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = {
  login,
  logout,
  signup,
  getMe,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
