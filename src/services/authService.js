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
  
  // 사용자 조회 (프로필 포함, 권한 필드 포함)
  const user = await db.User.findOne({ 
    where: { id: username },
    include: [
      {
        model: db.UserProfile,
        as: "UserProfile",
        attributes: [
          'id', 'full_name', 'phone_number', 'email', 'hire_date', 
          'position', 'department', 'role',
          'can_basic_info', 'can_receiving', 'can_plant1_preprocess',
          'can_plant_transfer', 'can_plant2_manufacture', 'can_shipping',
          'can_label', 'can_inventory', 'can_quality', 'can_user_management',
          'created_at', 'updated_at'
        ],
      },
    ],
  });
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

  // 서명 이미지 URL 생성 (주석처리)
  // let signatureImageUrl = null;
  // if (user.UserProfile?.signature_image_path) {
  //   const pathParts = user.UserProfile.signature_image_path.split('/');
  //   const fileName = pathParts[pathParts.length - 1];
  //   signatureImageUrl = `/api/static/signatures/${fileName}`;
  // }

  return { 
    id: user.id, 
    username: user.id,
    profile: {
      ...user.UserProfile.toJSON(),
      // signature_image_url: signatureImageUrl,
    }
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

  // 첫 번째 사용자인지 확인
  const userCount = await db.User.count();
  const isFirstUser = userCount === 0;

  // 기본 Role ID 설정 (하위 호환성 유지)
  let roleId = 1; // 기본 Role ID
  
  // role 파라미터가 제공되면 그것을 우선 사용
  if (role !== undefined && role !== null) {
    // 제공된 role이 유효한 Role ID인지 확인
    const providedRole = await db.Role.findByPk(role);
    if (providedRole) {
      roleId = providedRole.id;
    }
  }

  // 사용자 프로필 생성 (권한 필드 포함)
  const profileData = {
    full_name,
    phone_number,
    email,
    hire_date: hire_date || null,
    position: position || null,
    department: department || null,
    role: roleId, // Role ID 할당 (하위 호환성 유지)
  };

  // 첫 번째 사용자: 모든 권한 활성화
  if (isFirstUser) {
    profileData.can_basic_info = true;
    profileData.can_receiving = true;
    profileData.can_plant1_preprocess = true;
    profileData.can_plant_transfer = true;
    profileData.can_plant2_manufacture = true;
    profileData.can_shipping = true;
    profileData.can_label = true;
    profileData.can_inventory = true;
    profileData.can_quality = true;
    profileData.can_user_management = true;
  } else {
    // 그 이후 사용자: 모든 권한 비활성화 (기본값)
    profileData.can_basic_info = false;
    profileData.can_receiving = false;
    profileData.can_plant1_preprocess = false;
    profileData.can_plant_transfer = false;
    profileData.can_plant2_manufacture = false;
    profileData.can_shipping = false;
    profileData.can_label = false;
    profileData.can_inventory = false;
    profileData.can_quality = false;
    profileData.can_user_management = false;
  }

  const userProfile = await db.UserProfile.create(profileData);

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
        attributes: [
          'id', 'full_name', 'phone_number', 'email', 'hire_date', 
          'position', 'department', 'role',
          'can_basic_info', 'can_receiving', 'can_plant1_preprocess',
          'can_plant_transfer', 'can_plant2_manufacture', 'can_shipping',
          'can_label', 'can_inventory', 'can_quality', 'can_user_management',
          'created_at', 'updated_at'
        ],
      },
    ],
    attributes: { exclude: ['password'] }, // 비밀번호 제외
  });
  
  // 서명 이미지 URL 추가
  return users.map(user => {
    const userJson = user.toJSON();
    // 서명 이미지 URL 생성 (주석처리)
    // if (userJson.UserProfile?.signature_image_path) {
    //   const pathParts = userJson.UserProfile.signature_image_path.split('/');
    //   const fileName = pathParts[pathParts.length - 1];
    //   userJson.UserProfile.signature_image_url = `/api/static/signatures/${fileName}`;
    // }
    return userJson;
  });
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
        attributes: [
          'id', 'full_name', 'phone_number', 'email', 'hire_date', 
          'position', 'department', 'role',
          'can_basic_info', 'can_receiving', 'can_plant1_preprocess',
          'can_plant_transfer', 'can_plant2_manufacture', 'can_shipping',
          'can_label', 'can_inventory', 'can_quality', 'can_user_management',
          'created_at', 'updated_at'
        ],
      },
    ],
    attributes: { exclude: ['password'] }, // 비밀번호 제외
  });
  
  if (!user) {
    return null;
  }

  // 서명 이미지 URL 추가 (주석처리)
  const userJson = user.toJSON();
  // if (userJson.UserProfile?.signature_image_path) {
  //   const pathParts = userJson.UserProfile.signature_image_path.split('/');
  //   const fileName = pathParts[pathParts.length - 1];
  //   userJson.UserProfile.signature_image_url = `/api/static/signatures/${fileName}`;
  // }
  
  return userJson;
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
  // signature_image_path,
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
    // signature_image_path 업데이트 (주석처리)
    // if (signature_image_path !== undefined) {
    //   // 기존 도장 파일이 있으면 삭제 (선택사항)
    //   if (user.UserProfile.signature_image_path && signature_image_path !== user.UserProfile.signature_image_path) {
    //     const fs = require("fs");
    //     const path = require("path");
    //     const oldPath = path.join(__dirname, "../../", user.UserProfile.signature_image_path);
    //     try {
    //       if (fs.existsSync(oldPath)) {
    //         fs.unlinkSync(oldPath);
    //       }
    //     } catch (err) {
    //       // 파일 삭제 실패는 무시 (로깅만)
    //       console.warn("기존 도장 파일 삭제 실패:", err.message);
    //     }
    //   }
    //   updateFields.signature_image_path = signature_image_path;
    // }
    
    await user.UserProfile.update(updateFields);
  }

  // 업데이트된 사용자 정보 반환 (서명 이미지 URL 포함)
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

/**
 * 사용자 도장(서명) 이미지 업데이트 (주석처리)
 * @param {Object} req - Express 요청 객체
 * @param {string} userId - 사용자 ID
 * @param {string} signaturePath - 도장 이미지 경로
 * @returns {Promise<Object>} 업데이트된 사용자 정보
 * @throws {Error} 사용자를 찾을 수 없는 경우
 */
// async function updateUserSignature(req, userId, signaturePath) {
//   const db = req.app.get("db");
//   
//   const user = await db.User.findByPk(userId, { 
//     include: [
//       {
//         model: db.UserProfile,
//         as: "UserProfile",
//       },
//     ],
//   });
//   
//   if (!user) {
//     throw new Error("사용자를 찾을 수 없습니다");
//   }

//   if (!user.UserProfile) {
//     throw new Error("사용자 프로필을 찾을 수 없습니다");
//   }

//   // 기존 도장 파일이 있으면 삭제 (선택사항)
//   const fs = require("fs");
//   const path = require("path");
//   if (user.UserProfile.signature_image_path) {
//     const oldPath = path.join(__dirname, "../../", user.UserProfile.signature_image_path);
//     try {
//       if (fs.existsSync(oldPath)) {
//         fs.unlinkSync(oldPath);
//       }
//     } catch (err) {
//       // 파일 삭제 실패는 무시 (로깅만)
//       console.warn("기존 도장 파일 삭제 실패:", err.message);
//     }
//   }

//   // 도장 경로 업데이트
//   await user.UserProfile.update({
//     signature_image_path: signaturePath,
//   });

//   // 업데이트된 사용자 정보 반환 (서명 이미지 URL 포함)
//   const updatedUser = await getUserById(req, userId);
//   return updatedUser;
// }

/**
 * 사용자 도장(서명) 이미지 조회 (주석처리)
 * @param {Object} req - Express 요청 객체
 * @param {string} userId - 사용자 ID
 * @returns {Promise<string|null>} 도장 이미지 경로 또는 null
 */
// async function getUserSignature(req, userId) {
//   const db = req.app.get("db");
//   
//   const user = await db.User.findByPk(userId, { 
//     include: [
//       {
//         model: db.UserProfile,
//         as: "UserProfile",
//       },
//     ],
//   });
//   
//   if (!user || !user.UserProfile) {
//     return null;
//   }

//   return user.UserProfile.signature_image_path || null;
// }

/**
 * 사용자 권한 일괄 업데이트
 * @param {Object} req - Express 요청 객체
 * @param {string} userId - 사용자 ID
 * @param {Object} permissions - 권한 객체 (예: { can_basic_info: true, can_receiving: false })
 * @returns {Promise<Object>} 업데이트된 사용자 정보
 * @throws {Error} 사용자를 찾을 수 없는 경우
 */
async function updateUserPermissions(req, userId, permissions) {
  const db = req.app.get("db");
  
  const user = await db.User.findByPk(userId, { 
    include: [
      {
        model: db.UserProfile,
        as: "UserProfile",
      },
    ],
  });
  
  if (!user || !user.UserProfile) {
    const error = new Error("사용자를 찾을 수 없습니다");
    error.status = 404;
    throw error;
  }

  const validPermissions = [
    "can_basic_info",
    "can_receiving",
    "can_plant1_preprocess",
    "can_plant_transfer",
    "can_plant2_manufacture",
    "can_shipping",
    "can_label",
    "can_inventory",
    "can_quality",
    "can_user_management",
  ];

  const updateData = {};
  for (const [key, value] of Object.entries(permissions)) {
    if (validPermissions.includes(key)) {
      updateData[key] = value === true || value === "true" || value === 1;
    }
  }

  await user.UserProfile.update(updateData);

  // 업데이트된 사용자 정보 반환
  return getUserById(req, userId);
}

module.exports = {
  loginUser,
  logoutUser,
  signupUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserPermissions,
  // updateUserSignature,
  // getUserSignature,
};
