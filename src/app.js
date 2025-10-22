const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

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


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", indexRoute);

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
