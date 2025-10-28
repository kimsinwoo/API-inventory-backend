/**
 * 데이터베이스 복구 스크립트
 * 실행: node scripts/restore-database.js <백업파일명>
 */

const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
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
 * 데이터베이스 복구 실행
 */
function restoreDatabase(backupFile) {
  return new Promise((resolve, reject) => {
    const backupPath = path.join(BACKUP_DIR, backupFile);

    if (!fs.existsSync(backupPath)) {
      reject(new Error(`백업 파일을 찾을 수 없습니다: ${backupPath}`));
      return;
    }

    console.log("\n========================================");
    console.log("🔄 데이터베이스 복구 시작");
    console.log(`   데이터베이스: ${DB_NAME}`);
    console.log(`   백업 파일: ${backupPath}`);
    console.log("========================================\n");

    // 사용자 확인
    console.log("⚠️  경고: 기존 데이터가 모두 삭제됩니다!");
    console.log("계속하려면 Ctrl+C로 중단하거나 10초 기다리세요...\n");

    setTimeout(() => {
      const command = `mysql -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < "${backupPath}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("❌ 복구 실패:", error.message);
          reject(error);
          return;
        }

        if (stderr) {
          console.warn("⚠️  경고:", stderr);
        }

        console.log("\n========================================");
        console.log("✅ 복구 완료!");
        console.log("========================================\n");

        resolve({
          success: true,
          database: DB_NAME,
          backupFile,
        });
      });
    }, 10000); // 10초 대기
  });
}

/**
 * 사용 가능한 백업 파일 목록
 */
function listBackups() {
  console.log("\n========================================");
  console.log("📋 사용 가능한 백업 파일 목록");
  console.log("========================================\n");

  if (!fs.existsSync(BACKUP_DIR)) {
    console.log("백업 파일이 없습니다.\n");
    return [];
  }

  const files = fs.readdirSync(BACKUP_DIR);
  const backupFiles = files
    .filter((file) => file.startsWith("backup_") && file.endsWith(".sql"))
    .map((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      return {
        name: file,
        size: sizeMB,
        created: stats.birthtime,
      };
    })
    .sort((a, b) => b.created - a.created);

  if (backupFiles.length === 0) {
    console.log("백업 파일이 없습니다.\n");
    return [];
  }

  backupFiles.forEach((file, index) => {
    console.log(
      `${index + 1}. ${file.name} (${file.size} MB) - ${file.created.toLocaleString()}`
    );
  });

  console.log("\n");
  return backupFiles;
}

/**
 * 메인 함수
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    listBackups();
    console.log("사용법: node scripts/restore-database.js <백업파일명>");
    console.log("예시: node scripts/restore-database.js backup_inventory_development_20241028_120000.sql\n");
    process.exit(0);
  }

  const backupFile = args[0];

  try {
    await restoreDatabase(backupFile);
    console.log("🎉 복구 작업 완료!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ 복구 작업 실패:", error);
    process.exit(1);
  }
}

// 스크립트 실행
main();

