const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");

const db = require("../models");
const indexRoute = require("./routes/indexRoute");

dotenv.config();

const PORT = process.env.PORT || 4000;
const app = express();

app.set("db", db);

app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true, 
  })
);

// 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // https 사용 시 true로 변경
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", indexRoute);

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('=== ERROR ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('Body:', req.body);
  console.error('=============');
  
  res.status(err.status || 500).json({
    ok: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

async function startServer() {
  try {
    await db.sequelize.sync({ force: false });
    console.log("데이터베이스 연결 및 테이블 동기화 완료.");

    app.listen(PORT, () => {
      console.log(`서버 실행 중: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("서버 시작 중 오류 발생:", err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
