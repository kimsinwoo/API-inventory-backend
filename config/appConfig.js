/**
 * 애플리케이션 설정
 * 환경별 설정 관리 (로컬/클라우드)
 */
const dotenv = require('dotenv');

dotenv.config();

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
// 클라우드 배포 플래그 + 프로덕션이면 클라우드 모드로 간주
const IS_CLOUD =
  (process.env.CLOUD_DEPLOYMENT ?? '').toLowerCase() === 'true' || IS_PRODUCTION;

module.exports = {
  // 환경 정보
  env: {
    NODE_ENV,
    IS_PRODUCTION,
    IS_CLOUD,
    IS_LOCAL: !IS_CLOUD
  },

  // 서버 설정
  server: {
    port: Number(process.env.PORT ?? 4000),
    host: process.env.HOST ?? '0.0.0.0',
    // CORS: 필요 시 .env 에 CORS_ORIGIN 세팅
    corsOrigin:
      process.env.CORS_ORIGIN ??
      (IS_PRODUCTION ? '*' : 'http://localhost:3000')
  },

  // 세션 설정
  session: {
    secret:
      process.env.SESSION_SECRET ??
      'your-secret-key-change-this-in-production',
    secure: IS_PRODUCTION, // HTTPS 사용 시 true
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7일
  },

  // 프린터 / 라벨 관련 설정
  printer: {
    /**
     * 프린터 사용 여부
     * - 클라우드 환경에서는 기본적으로 false (PDF 저장만)
     * - 필요하면 .env 에 PRINTER_ENABLED=true 로 강제 활성화
     */
    enabled:
      !IS_CLOUD ||
      (process.env.PRINTER_ENABLED ?? '').toLowerCase() === 'true',

    /**
     * 프린터 타입
     * - 'local'   : 서버에 직접 붙은 프린터(CUPS/Windows) 사용
     * - 'cloud'   : PDF 저장만 하고, 프론트에서 window.print() 사용
     * - 'network' : (확장용) 네트워크 프린터 용
     *
     * 배포 환경에서는 기본적으로 'cloud' 로 두고,
     * 내부 전용 서버에서만 'local' 로 사용하는 걸 추천.
     */
    type: IS_CLOUD ? 'cloud' : (process.env.PRINTER_TYPE ?? 'local'),

    /**
     * PDF 저장 경로 (서버 파일 시스템 기준)
     * 이 경로를 Express static 또는 Nginx 에 매핑해서
     * 프론트에서 접근 가능한 URL 로 노출해야 함.
     */
    pdfSavePath: process.env.PDF_SAVE_PATH ?? './uploads/label-pdfs',

    // Puppeteer 가 임시 PDF 등을 생성할 때 사용할 폴더
    tempPath: process.env.TEMP_PATH ?? './temp',

    // 프린터 조회 타임아웃 (ms)
    listTimeout: Number(process.env.PRINTER_LIST_TIMEOUT ?? 30000),

    /**
     * PDF 공개 URL 베이스
     * - 예: https://anniecong.o-r.kr/static/labels
     * - 서비스에서 생성된 파일명을 붙여서 publicUrl 을 만든다.
     *
     * .env 예시:
     *   LABEL_PUBLIC_BASE_URL=https://anniecong.o-r.kr/static/labels
     */
    publicBaseUrl: process.env.LABEL_PUBLIC_BASE_URL ?? ''
  },

  // Puppeteer 설정
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security'
    ],
    // 클라우드 환경에서 실행 파일 경로 지정 (필요 시)
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? null
  },

  // 파일 업로드 설정
  upload: {
    maxFileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE ?? 10 * 1024 * 1024), // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/csv'
    ],
    uploadPath: process.env.UPLOAD_PATH ?? './uploads'
  },

  // 로깅 설정
  logging: {
    level:
      process.env.LOG_LEVEL ??
      (IS_PRODUCTION ? 'info' : 'debug'),
    // "false" 로 명시했을 때만 로그 비활성화
    enableRequestLogging:
      (process.env.ENABLE_REQUEST_LOGGING ?? 'true').toLowerCase() !==
      'false'
  }
};
  