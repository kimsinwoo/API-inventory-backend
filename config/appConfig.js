/**
 * 애플리케이션 설정
 * 환경별 설정 관리 (로컬/클라우드)
 */
const dotenv = require("dotenv");
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";
const IS_CLOUD = process.env.CLOUD_DEPLOYMENT === "true" || IS_PRODUCTION;

module.exports = {
  // 환경 정보
  env: {
    NODE_ENV,
    IS_PRODUCTION,
    IS_CLOUD,
    IS_LOCAL: !IS_CLOUD,
  },

  // 서버 설정
  server: {
    port: process.env.PORT || 4000,
    host: process.env.HOST || "0.0.0.0",
    corsOrigin: process.env.CORS_ORIGIN || (IS_PRODUCTION ? "*" : "http://localhost:3000"),
  },

  // 세션 설정
  session: {
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
    secure: IS_PRODUCTION, // HTTPS 사용 시 true
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
  },

  // 프린터 설정
  printer: {
    // 클라우드 환경에서는 프린터 접근 불가능하므로 PDF 저장 모드
    enabled: !IS_CLOUD || process.env.PRINTER_ENABLED === "true",
    // 프린터 타입: 'local' (로컬 프린터), 'cloud' (PDF 저장), 'network' (네트워크 프린터)
    type: IS_CLOUD ? "cloud" : process.env.PRINTER_TYPE || "local",
    // PDF 저장 경로 (클라우드 환경)
    pdfSavePath: process.env.PDF_SAVE_PATH || "./uploads/label-pdfs",
    // 임시 파일 경로
    tempPath: process.env.TEMP_PATH || "./temp",
    // 프린터 조회 타임아웃 (ms)
    listTimeout: 30000,
  },

  // Puppeteer 설정
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-web-security",
    ],
    // 클라우드 환경에서 실행 파일 경로 지정 (필요 시)
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
  },

  // 파일 업로드 설정
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/csv"],
    uploadPath: process.env.UPLOAD_PATH || "./uploads",
  },

  // 로깅 설정
  logging: {
    level: process.env.LOG_LEVEL || (IS_PRODUCTION ? "info" : "debug"),
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== "false",
  },
};

