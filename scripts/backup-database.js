/**
 * 데이터베이스 백업 스크립트
 * 실행: node scripts/backup-database.js
 */

const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const dayjs = require("dayjs");
require("dotenv").config();

const BACKUP_DIR = path.join(__dirname, "../backups");
const DB_NAME = process.env.NODE_ENV === "production" 
  ? "inventory_production" 
  : "inventory_development";
const DB_USER = "root";
const DB_PASSWORD = process.env.NODE_ENV === "production"
  ? process.env.PRODUCTION_DB_PASSWORD
  : process.env.DEV_DB_PASSWORD;
const DB_HOST = "127.0.0.1";

/**
 * 백업 디렉토리 생성
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ 백업 디렉토리 생성: ${BACKUP_DIR}`);
  }
}

/**
 * 데이터베이스 백업 실행
 */
function backupDatabase() {
  return new Promise((resolve, reject) => {
    const timestamp = dayjs().format("YYYYMMDD_HHmmss");
    const backupFile = path.join(
      BACKUP_DIR,
      `backup_${DB_NAME}_${timestamp}.sql`
    );

    console.log("\n========================================");
    console.log("📦 데이터베이스 백업 시작");
    console.log(`   데이터베이스: ${DB_NAME}`);
    console.log(`   백업 파일: ${backupFile}`);
    console.log("========================================\n");

    // mysqldump 명령어 실행
    const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > "${backupFile}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ 백업 실패:", error.message);
        reject(error);
        return;
      }

      if (stderr) {
        console.warn("⚠️  경고:", stderr);
      }

      const stats = fs.statSync(backupFile);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log("\n========================================");
      console.log("✅ 백업 완료!");
      console.log(`   파일 크기: ${fileSizeMB} MB`);
      console.log(`   저장 위치: ${backupFile}`);
      console.log("========================================\n");

      resolve({
        success: true,
        file: backupFile,
        size: fileSizeMB,
        timestamp,
      });
    });
  });
}

/**
 * 오래된 백업 파일 삭제
 */
function cleanupOldBackups(retentionDays = 30) {
  console.log(`\n🗑️  ${retentionDays}일 이전 백업 파일 정리 중...`);

  const files = fs.readdirSync(BACKUP_DIR);
  const threshold = dayjs().subtract(retentionDays, "day");
  let deletedCount = 0;

  files.forEach((file) => {
    if (file.startsWith("backup_") && file.endsWith(".sql")) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const fileDate = dayjs(stats.birthtime);

      if (fileDate.isBefore(threshold)) {
        fs.unlinkSync(filePath);
        console.log(`   삭제: ${file}`);
        deletedCount++;
      }
    }
  });

  if (deletedCount > 0) {
    console.log(`✅ ${deletedCount}개의 오래된 백업 파일 삭제 완료\n`);
  } else {
    console.log("✅ 삭제할 오래된 백업 파일 없음\n");
  }
}

/**
 * 메인 함수
 */
async function main() {
  try {
    ensureBackupDir();
    await backupDatabase();
    cleanupOldBackups(30);

    console.log("🎉 백업 작업 완료!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ 백업 작업 실패:", error);
    process.exit(1);
  }
}

// 스크립트 실행
main();

