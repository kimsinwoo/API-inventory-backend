/**
 * 파일 업로드 미들웨어
 * - Multer를 사용한 파일 업로드 처리
 * - CSV/엑셀 파일 업로드 전용
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, '../../uploads/order-imports');

// uploads 디렉토리가 없으면 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 스토리지 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 파일명: timestamp-randomNumber-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, uniqueSuffix + '-' + originalName);
  }
});

// 파일 필터 (CSV/엑셀만 허용)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ext !== '.xlsx' && ext !== '.xls' && ext !== '.csv') {
    return cb(new Error('CSV 또는 엑셀 파일만 업로드 가능합니다.'), false);
  }
  
  cb(null, true);
};

// Multer 인스턴스 생성
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
    files: 10 // 최대 10개 파일
  }
});

/**
 * 단일 파일 업로드 미들웨어
 */
const uploadSingle = upload.single('file');

/**
 * 다중 파일 업로드 미들웨어 (최대 10개)
 */
const uploadMultiple = upload.array('files', 10);

/**
 * 업로드 에러 핸들러
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer 관련 에러
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        ok: false,
        message: '파일 크기가 10MB를 초과했습니다.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        ok: false,
        message: '최대 10개의 파일만 업로드할 수 있습니다.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        ok: false,
        message: '예상치 못한 필드명입니다. "file" 또는 "files"를 사용하세요.'
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
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  uploadDir
};



