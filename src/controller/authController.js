/**
 * 인증 및 사용자 관리 컨트롤러
 * - 로그인, 로그아웃, 회원가입 기능
 * - 사용자 정보 조회 및 관리
 */
const authService = require("../services/authService");

/**
 * 사용자 로그인
 * - 세션 기반 인증 사용
 * - 로그인 성공 시 세션 쿠키 자동 설정
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        message: "사용자명과 비밀번호를 모두 입력해주세요" 
      });
    }
    
    const user = await authService.loginUser(req, username, password);
    
    res.json({ 
      message: "로그인 성공", 
      user 
    });
  } catch (error) {
    res.status(401).json({ 
      message: error.message || "로그인 실패" 
    });
  }
}

/**
 * 사용자 로그아웃
 * - 세션 삭제 및 쿠키 제거
 */
async function logout(req, res) {
  try {
    await authService.logoutUser(req);
    res.clearCookie("connect.sid");
    
    res.json({ 
      message: "로그아웃 성공" 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "로그아웃 실패" 
    });
  }
}

/**
 * 현재 로그인한 사용자 정보 조회
 * - 세션에서 사용자 ID를 가져와 조회
 */
async function getMe(req, res) {
  try {
    const userId = req.session.userId;
    console.log("userId : ", userId);
    if (!userId) {
      return res.status(401).json({ 
        message: "로그인이 필요합니다" 
      });
    }
    
    const user = await authService.getUserById(req, userId);
    
    if (!user) {
      return res.status(404).json({ 
        message: "사용자를 찾을 수 없습니다" 
      });
    }
    
    // 서명 이미지 URL 추가
    const profile = user.profile || user.UserProfile || {};
    let signatureImageUrl = null;
    if (profile.signature_image_path) {
      const pathParts = profile.signature_image_path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      signatureImageUrl = `/api/static/signatures/${fileName}`;
    }

    res.json({ 
      message: "사용자 정보 조회 성공", 
      user: {
        id: user.id,
        profile: {
          ...profile,
          signature_image_url: signatureImageUrl,
        }
      }
    });
  } catch (error) {
    res.status(400).json({ 
      message: error.message 
    });
  }
}

/**
 * 회원가입
 * - 사용자 프로필과 계정 정보 생성
 */
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

    // 필수 필드 검증
    if (!username || !password || !full_name || !phone_number || !email) {
      return res.status(400).json({ 
        message: "필수 필드를 모두 입력해주세요 (username, password, full_name, phone_number, email)" 
      });
    }

    const user = await authService.signupUser(req, {
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
    
    res.status(201).json({ 
      message: "회원가입 성공", 
      user: {
        id: user.id,
        username: user.id
      }
    });
  } catch (error) {
    res.status(400).json({ 
      message: error.message 
    });
  }
}

/**
 * 모든 사용자 목록 조회
 * - 관리자 권한 필요 (authenticate 미들웨어에서 확인)
 */
async function getAllUsers(req, res) {
  try {
    const users = await authService.getAllUsers(req);
    
    res.json({ 
      message: "사용자 목록 조회 성공", 
      users 
    });
  } catch (error) {
    res.status(400).json({ 
      message: error.message 
    });
  }
}

/**
 * 특정 사용자 정보 조회
 */
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await authService.getUserById(req, id);
    
    if (!user) {
      return res.status(404).json({ 
        message: "사용자를 찾을 수 없습니다" 
      });
    }
    
    res.json({ 
      message: "사용자 조회 성공", 
      user 
    });
  } catch (error) {
    res.status(400).json({ 
      message: error.message 
    });
  }
}

/**
 * 사용자 정보 수정
 */
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
      signature_image_path,
    } = req.body;
    
    const user = await authService.updateUser(req, id, {
      full_name,
      phone_number,
      email,
      hire_date,
      position,
      department,
      role,
      signature_image_path,
    });
    
    res.json({ 
      message: "사용자 정보가 성공적으로 수정되었습니다", 
      user 
    });
  } catch (error) {
    res.status(400).json({ 
      message: error.message 
    });
  }
}

/**
 * 사용자 삭제
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    await authService.deleteUser(req, id);
    
    res.json({ 
      message: "사용자가 성공적으로 삭제되었습니다" 
    });
  } catch (error) {
    res.status(400).json({ 
      message: error.message 
    });
  }
}

/**
 * 도장(서명) 이미지 업로드
 */
async function uploadSignature(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "도장 이미지 파일을 업로드해주세요"
      });
    }

    const userId = req.user?.id || req.session.userId;
    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "로그인이 필요합니다"
      });
    }

    // 상대 경로로 저장 (uploads/signatures/...)
    const path = require("path");
    const relativePath = path.relative(path.join(__dirname, "../../"), req.file.path).replace(/\\/g, "/");
    const user = await authService.updateUserSignature(req, userId, relativePath);

    // 서명 이미지 URL 생성
    let signatureImageUrl = null;
    if (user.UserProfile?.signature_image_path) {
      const pathParts = user.UserProfile.signature_image_path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      signatureImageUrl = `/api/static/signatures/${fileName}`;
    }

    res.json({
      ok: true,
      message: "도장이 성공적으로 업로드되었습니다",
      data: {
        signatureImagePath: user.UserProfile.signature_image_path,
        signatureImageUrl: signatureImageUrl
      }
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
}

/**
 * 도장(서명) 이미지 조회
 */
async function getSignature(req, res) {
  try {
    const userId = req.user?.id || req.session.userId;
    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "로그인이 필요합니다"
      });
    }

    const signaturePath = await authService.getUserSignature(req, userId);

    if (!signaturePath) {
      return res.status(404).json({
        ok: false,
        message: "도장이 등록되지 않았습니다"
      });
    }

    res.json({
      ok: true,
      data: {
        signatureImagePath: signaturePath
      }
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
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
  uploadSignature,
  getSignature,
};
