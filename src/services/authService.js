/**
 * 인증 및 사용자 관리 서비스
 * - 사용자 인증 및 세션 관리
 * - 사용자 CRUD 작업
 */
const bcrypt = require("bcryptjs");
const { createSession } = require("../utils/sessionAuth");

/**
 * 사용자 로그인
 * @param {Object} req - Express 요청 객체
 * @param {string} username - 사용자명
 * @param {string} password - 비밀번호
 * @returns {Promise<Object>} 로그인한 사용자 정보
 * @throws {Error} 사용자를 찾을 수 없거나 비밀번호가 일치하지 않는 경우
 */
async function loginUser(req, username, password) {
  const db = req.app.get("db");
  
  // 사용자 조회
  const user = await db.User.findOne({ where: { id: username } });
  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다");
  }

  // 비밀번호 확인
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new Error("비밀번호가 일치하지 않습니다");
  }

  // 세션 생성
  await createSession(req, user);

  return { 
    id: user.id, 
    username: user.id 
  };
}

/**
 * 사용자 로그아웃
 * @param {Object} req - Express 요청 객체
 * @returns {Promise<void>}
 */
async function logoutUser(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        reject(new Error("세션 종료 중 오류가 발생했습니다"));
      } else {
        resolve();
      }
    });
  });
}

/**
 * 회원가입
 * @param {Object} req - Express 요청 객체
 * @param {Object} userData - 사용자 정보
 * @returns {Promise<Object>} 생성된 사용자 정보
 * @throws {Error} 사용자 생성 중 오류 발생 시
 */
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

  // 중복 사용자명 확인
  const existingUser = await db.User.findOne({ where: { id: username } });
  if (existingUser) {
    throw new Error("이미 사용 중인 사용자명입니다");
  }

  // 사용자 프로필 생성
  const userProfile = await db.UserProfile.create({
    full_name,
    phone_number,
    email,
    hire_date: hire_date || null,
    position: position || null,
    department: department || null,
    role: role || 1, // 기본값: 1 (일반 직원)
  });

  // 비밀번호 해싱 (보안을 위해 10 라운드)
  const hashedPassword = await bcrypt.hash(password, 10);

  // 사용자 계정 생성
  const user = await db.User.create({
    id: username,
    password: hashedPassword,
    profile_id: userProfile.id,
  });

  return user;
}

/**
 * 모든 사용자 목록 조회
 * @param {Object} req - Express 요청 객체
 * @returns {Promise<Array>} 사용자 목록
 */
async function getAllUsers(req) {
  const db = req.app.get("db");
  
  const users = await db.User.findAll({
    include: [
      {
        model: db.UserProfile,
        as: "UserProfile",
      },
    ],
    attributes: { exclude: ['password'] }, // 비밀번호 제외
  });
  
  return users;
}

/**
 * ID로 특정 사용자 조회
 * @param {Object} req - Express 요청 객체
 * @param {string} id - 사용자 ID
 * @returns {Promise<Object|null>} 사용자 정보 또는 null
 */
async function getUserById(req, id) {
  const db = req.app.get("db");
  
  const user = await db.User.findByPk(id, {
    include: [
      {
        model: db.UserProfile,
        as: "UserProfile",
      },
    ],
    attributes: { exclude: ['password'] }, // 비밀번호 제외
  });
  
  return user;
}

/**
 * 사용자 정보 수정
 * @param {Object} req - Express 요청 객체
 * @param {string} id - 사용자 ID
 * @param {Object} updateData - 수정할 데이터
 * @returns {Promise<Object>} 수정된 사용자 정보
 * @throws {Error} 사용자를 찾을 수 없는 경우
 */
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
  
  const user = await db.User.findByPk(id, { 
    include: [
      {
        model: db.UserProfile,
        as: "UserProfile",
      },
    ],
  });
  
  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다");
  }

  // 사용자 프로필 업데이트
  if (user.UserProfile) {
    const updateFields = {};
    
    if (full_name !== undefined) updateFields.full_name = full_name;
    if (phone_number !== undefined) updateFields.phone_number = phone_number;
    if (email !== undefined) updateFields.email = email;
    if (hire_date !== undefined) updateFields.hire_date = hire_date;
    if (position !== undefined) updateFields.position = position;
    if (department !== undefined) updateFields.department = department;
    if (role !== undefined) updateFields.role = role;
    
    await user.UserProfile.update(updateFields);
  }

  // 업데이트된 사용자 정보 반환
  return getUserById(req, id);
}

/**
 * 사용자 삭제
 * @param {Object} req - Express 요청 객체
 * @param {string} id - 사용자 ID
 * @returns {Promise<Object>} 삭제된 사용자 정보
 * @throws {Error} 사용자를 찾을 수 없는 경우
 */
async function deleteUser(req, id) {
  const db = req.app.get("db");
  
  const user = await db.User.findByPk(id, {
    include: [
      {
        model: db.UserProfile,
        as: "UserProfile",
      },
    ],
  });
  
  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다");
  }
  
  // 사용자 프로필도 함께 삭제 (CASCADE 설정에 따라 자동 삭제될 수 있음)
  if (user.UserProfile) {
    await user.UserProfile.destroy();
  }
  
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
