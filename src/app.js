/**
 * 재고 관리 시스템 메인 애플리케이션
 * - Express 서버 설정
 * - 미들웨어 구성
 * - 라우트 설정
 * - 환경별 설정 관리 (로컬/클라우드)
 */
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const fs = require("fs").promises;

const db = require("../models");
const indexRoute = require("./routes/indexRoute");
const activityLogger = require("./middleware/activityLogger");
const appConfig = require("../config/appConfig");

// 환경 변수 로드
dotenv.config();

const app = express();

// 데이터베이스 인스턴스를 앱에 설정 (모든 라우트에서 접근 가능)
app.set("db", db);

// CORS 설정 (환경별)
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.0.35:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// 세션 미들웨어 설정
app.use(
  session({
    secret: appConfig.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: appConfig.session.secure,
      httpOnly: appConfig.session.httpOnly,
      maxAge: appConfig.session.maxAge,
    },
  })
);

// Body 파싱 미들웨어
app.use(express.json({ limit: "10mb" })); // JSON 형식의 요청 본문 파싱
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // URL 인코딩된 데이터 파싱

app.use(
  '/static/labels',
  require('express').static(
    path.resolve(process.cwd(), appConfig.printer.pdfSavePath)
  )
);
app.use('/api/label', require('./routes/labelRoute'));


// 활동 로그 미들웨어 (헬스체크 제외)
if (appConfig.logging.enableRequestLogging) {
  app.use(activityLogger.skipLogging(["/api/health/ping", "/api/health/liveness"]));
  app.use(activityLogger.addRequestId);
}

// API 라우트 등록
app.use("/api", indexRoute);

// 전역 에러 핸들러
if (appConfig.logging.enableRequestLogging) {
  app.use(activityLogger.logError);
}
app.use((error, req, res, next) => {
  const isDevelopment = appConfig.env.NODE_ENV === "development";
  res.status(error.status || 500).json({
    ok: false,
    message: error.message || "서버 내부 오류가 발생했습니다",
    error: isDevelopment ? error.stack : undefined,
    requestId: req.requestId || null,
  });
});

/**
 * 필요한 디렉토리 생성
 */
async function ensureDirectories() {
  const directories = [
    appConfig.printer.tempPath,
    appConfig.printer.pdfSavePath,
    appConfig.upload.uploadPath,
  ];

  for (const dir of directories) {
    const fullPath = path.resolve(process.cwd(), dir);
    try {
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`✓ 디렉토리 확인: ${fullPath}`);
    } catch (error) {
      console.warn(`⚠ 디렉토리 생성 실패: ${fullPath}`, error.message);
    }
  }
}

/**
 * 서버 시작 함수
 * - 필요한 디렉토리 생성
 * - 데이터베이스 연결 확인
 * - Express 서버 시작
 */
async function startServer() {
  try {
    // 필요한 디렉토리 생성
    await ensureDirectories();

    // 데이터베이스 연결 및 동기화
    await db.sequelize.authenticate();
    console.log("✓ 데이터베이스 연결 성공");

    // 프로덕션 환경이 아닐 때만 동기화
    if (!appConfig.env.IS_PRODUCTION) {
      await db.sequelize.sync({ force: false });
      console.log("✓ 데이터베이스 테이블 동기화 완료");
    }

    // 서버 시작
    const server = app.listen(appConfig.server.port, appConfig.server.host, () => {
      console.log(`========================================`);
      console.log(`✓ 서버가 정상적으로 시작되었습니다`);
      console.log(`✓ 포트: ${appConfig.server.port}`);
      console.log(`✓ 호스트: ${appConfig.server.host}`);
      console.log(`✓ 환경: ${appConfig.env.NODE_ENV}`);
      console.log(`✓ 모드: ${appConfig.env.IS_CLOUD ? "클라우드" : "로컬"}`);
      console.log(`✓ 프린터: ${appConfig.printer.enabled ? "활성화" : "비활성화"} (${appConfig.printer.type})`);
      console.log(`✓ CORS: ${appConfig.server.corsOrigin}`);
      console.log(`========================================`);
    });

    // 서버 종료 시 정리
    process.on("SIGTERM", async () => {
      console.log("SIGTERM 신호 수신, 서버 종료 중...");
      server.close(() => {
        console.log("서버 종료 완료");
        process.exit(0);
      });
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT 신호 수신, 서버 종료 중...");
      server.close(() => {
        console.log("서버 종료 완료");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("========================================");
    console.error("✗ 서버 시작 중 오류 발생");
    console.error("✗ 에러:", error.message);
    if (appConfig.env.NODE_ENV === "development") {
      console.error("✗ 스택:", error.stack);
    }
    console.error("========================================");
    process.exit(1);
  }
}

// 서버 시작
startServer();

module.exports = app;
