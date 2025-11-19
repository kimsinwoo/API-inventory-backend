/**
 * 도장(서명) 이미지 업로드 미들웨어
 * - Multer를 사용한 이미지 파일 업로드 처리
 * - PNG, JPG, JPEG 형식만 허용
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, '../../uploads/signatures');

// uploads/signatures 디렉토리가 없으면 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 스토리지 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 파일명: userId-timestamp-randomNumber.확장자
    const userId = req.user?.id || 'anonymous';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${userId}-${uniqueSuffix}${ext}`);
  }
});

// 파일 필터 (이미지 파일만 허용)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  
  if (!allowedTypes.includes(ext)) {
    return cb(new Error('이미지 파일만 업로드 가능합니다. (PNG, JPG, JPEG, GIF, WEBP)'), false);
  }
  
  // MIME 타입 확인
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
  }
  
  cb(null, true);
};

// Multer 인스턴스 생성
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  }
});

/**
 * 단일 이미지 파일 업로드 미들웨어
 */
const uploadSignature = upload.single('signature');

/**
 * 업로드 에러 핸들러
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer 관련 에러
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        ok: false,
        message: '파일 크기가 5MB를 초과했습니다.'
      });
    }
    
    return res.status(400).json({
      ok: false,
      message: '파일 업로드 중 오류가 발생했습니다.',
      error: err.message
    });
  }
  
  if (err) {
    // 기타 에러 (파일 필터 등)
    return res.status(400).json({
      ok: false,
      message: err.message
    });
  }
  
  next();
};

module.exports = {
  uploadSignature,
  handleUploadError,
  uploadDir
};

