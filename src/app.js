/**
 * 재고 관리 시스템 메인 애플리케이션
 * - Express 서버 설정
 * - 미들웨어 구성
 * - 라우트 설정
 */
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");

const db = require("../models");
const indexRoute = require("./routes/indexRoute");

// 환경 변수 로드
dotenv.config();

const PORT = process.env.PORT || 4000;
const app = express();

// 데이터베이스 인스턴스를 앱에 설정 (모든 라우트에서 접근 가능)
app.set("db", db);

// CORS 설정 (프론트엔드와의 통신 허용)
app.use(
  cors({
    origin: "http://localhost:3000",  // 프론트엔드 URL
    credentials: true,  // 쿠키 전송 허용
  })
);

// 세션 미들웨어 설정 (로그인 세션 관리)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
    resave: false,  // 세션이 수정되지 않아도 저장하지 않음
    saveUninitialized: false,  // 초기화되지 않은 세션 저장하지 않음
    cookie: {
      secure: false,  // HTTPS 사용 시 true로 변경
      httpOnly: true,  // XSS 공격 방지
      maxAge: 1000 * 60 * 60 * 24 * 7,  // 7일
    },
  })
);

// Body 파싱 미들웨어
app.use(express.json());  // JSON 형식의 요청 본문 파싱
app.use(express.urlencoded({ extended: true }));  // URL 인코딩된 데이터 파싱

// API 라우트 등록
app.use("/api", indexRoute);

// 전역 에러 핸들러
app.use((error, req, res, next) => {
  console.error('========== 에러 발생 ==========');
  console.error('에러 메시지:', error.message);
  console.error('에러 스택:', error.stack);
  console.error('요청 경로:', req.path);
  console.error('요청 메서드:', req.method);
  console.error('요청 본문:', req.body);
  console.error('================================');
  
  res.status(error.status || 500).json({
    ok: false,
    message: error.message || '서버 내부 오류가 발생했습니다',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

/**
 * 서버 시작 함수
 * - 데이터베이스 연결 확인
 * - Express 서버 시작
 */
async function startServer() {
  try {
    // 데이터베이스 연결 및 동기화
    await db.sequelize.sync({ force: false });
    console.log("✓ 데이터베이스 연결 및 테이블 동기화 완료");

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`✓ 서버가 정상적으로 시작되었습니다`);
      console.log(`✓ 포트: ${PORT}`);
      console.log(`✓ URL: http://localhost:${PORT}`);
      console.log(`✓ 환경: ${process.env.NODE_ENV || 'development'}`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error("========================================");
    console.error("✗ 서버 시작 중 오류 발생");
    console.error("✗ 에러:", error);
    console.error("========================================");
    process.exit(1);
  }
}

// 서버 시작
startServer();

module.exports = app;
