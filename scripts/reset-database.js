/**
 * 데이터베이스 초기화 스크립트
 * 실행: node scripts/reset-database.js [옵션]
 * 
 * 옵션:
 *   --truncate : 데이터만 삭제 (테이블 구조 유지)
 *   --drop     : 테이블 삭제 후 재생성 (마이그레이션 롤백)
 *   --force    : 확인 없이 즉시 실행
 */

const { exec } = require("child_process");
const readline = require("readline");
require("dotenv").config();

const DB_NAME = process.env.NODE_ENV === "production" 
  ? "inventory_production" 
  : "inventory_development";
const DB_USER = "root";
const DB_PASSWORD = process.env.NODE_ENV === "production"
  ? process.env.PRODUCTION_DB_PASSWORD
  : process.env.DEV_DB_PASSWORD;
const DB_HOST = "127.0.0.1";

// 명령줄 인자 파싱
const args = process.argv.slice(2);
const truncateMode = args.includes("--truncate");
const dropMode = args.includes("--drop");
const forceMode = args.includes("--force");

/**
 * 사용자 확인 받기
 */
function askConfirmation(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes" || answer.toLowerCase() === "y");
    });
  });
}

/**
 * MySQL 명령 실행
 */
function executeMysqlCommand(command) {
  return new Promise((resolve, reject) => {
    const mysqlCmd = `mysql -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -e "${command}"`;
    
    exec(mysqlCmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr && !stderr.includes("Warning")) {
        console.warn("경고:", stderr);
      }
      resolve(stdout);
    });
  });
}

/**
 * 테이블 목록 가져오기
 */
async function getTables() {
  try {
    const command = `mysql -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -e "SHOW TABLES;" -N`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        const tables = stdout
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => line.trim());
        resolve(tables);
      });
    });
  } catch (error) {
    console.error("테이블 목록 조회 실패:", error.message);
    throw error;
  }
}

/**
 * 모든 테이블 데이터 삭제 (TRUNCATE)
 */
async function truncateAllTables() {
  console.log("\n========================================");
  console.log("🗑️  데이터 삭제 시작 (테이블 구조 유지)");
  console.log("========================================\n");

  try {
    // 외래 키 체크 비활성화
    await executeMysqlCommand("SET FOREIGN_KEY_CHECKS = 0;");
    console.log("✓ 외래 키 체크 비활성화");

    // 테이블 목록 가져오기
    const tables = await getTables();
    console.log(`✓ 총 ${tables.length}개 테이블 발견\n`);

    // 각 테이블 TRUNCATE
    for (const table of tables) {
      try {
        await executeMysqlCommand(`TRUNCATE TABLE \`${table}\`;`);
        console.log(`  ✓ ${table} - 데이터 삭제 완료`);
      } catch (error) {
        console.error(`  ✗ ${table} - 삭제 실패:`, error.message);
      }
    }

    // 외래 키 체크 활성화
    await executeMysqlCommand("SET FOREIGN_KEY_CHECKS = 1;");
    console.log("\n✓ 외래 키 체크 활성화");

    console.log("\n========================================");
    console.log("✅ 모든 데이터 삭제 완료!");
    console.log("========================================\n");

    return { success: true, tablesProcessed: tables.length };
  } catch (error) {
    console.error("\n❌ 데이터 삭제 중 오류 발생:", error.message);
    throw error;
  }
}

/**
 * 테이블 삭제 후 재생성 (마이그레이션 롤백)
 */
async function dropAndRecreate() {
  console.log("\n========================================");
  console.log("🔄 데이터베이스 재생성 시작");
  console.log("========================================\n");

  return new Promise((resolve, reject) => {
    // 1. 모든 마이그레이션 롤백
    console.log("1️⃣ 마이그레이션 롤백 중...");
    exec("npx sequelize-cli db:migrate:undo:all", (error, stdout, stderr) => {
      if (error) {
        console.error("❌ 마이그레이션 롤백 실패:", error.message);
        reject(error);
        return;
      }

      console.log(stdout);
      console.log("✓ 마이그레이션 롤백 완료\n");

      // 2. 마이그레이션 재실행
      console.log("2️⃣ 마이그레이션 실행 중...");
      exec("npx sequelize-cli db:migrate", (error2, stdout2, stderr2) => {
        if (error2) {
          console.error("❌ 마이그레이션 실행 실패:", error2.message);
          reject(error2);
          return;
        }

        console.log(stdout2);
        console.log("✓ 마이그레이션 실행 완료\n");

        console.log("========================================");
        console.log("✅ 데이터베이스 재생성 완료!");
        console.log("========================================\n");

        resolve({ success: true });
      });
    });
  });
}

/**
 * 빠른 삭제 (SequelizeData 제외)
 */
async function quickDelete() {
  console.log("\n========================================");
  console.log("⚡ 빠른 데이터 삭제");
  console.log("========================================\n");

  try {
    await executeMysqlCommand("SET FOREIGN_KEY_CHECKS = 0;");
    
    const tables = await getTables();
    const skipTables = ["SequelizeMeta"]; // 마이그레이션 이력은 유지
    
    for (const table of tables) {
      if (skipTables.includes(table)) {
        console.log(`  ⊙ ${table} - 건너뛰기 (시스템 테이블)`);
        continue;
      }
      
      try {
        await executeMysqlCommand(`TRUNCATE TABLE \`${table}\`;`);
        console.log(`  ✓ ${table}`);
      } catch (error) {
        console.error(`  ✗ ${table}:`, error.message);
      }
    }
    
    await executeMysqlCommand("SET FOREIGN_KEY_CHECKS = 1;");
    
    console.log("\n✅ 빠른 삭제 완료!\n");
    return { success: true };
  } catch (error) {
    console.error("❌ 삭제 실패:", error);
    throw error;
  }
}

/**
 * 메인 함수
 */
async function main() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   데이터베이스 초기화 스크립트         ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`\n데이터베이스: ${DB_NAME}`);
  console.log(`환경: ${process.env.NODE_ENV || "development"}\n`);

  // 모드 선택
  let mode;
  if (dropMode) {
    mode = "drop";
    console.log("모드: 테이블 삭제 후 재생성\n");
  } else if (truncateMode) {
    mode = "truncate";
    console.log("모드: 데이터만 삭제 (테이블 유지)\n");
  } else {
    mode = "quick";
    console.log("모드: 빠른 삭제 (기본)\n");
  }

  // 확인
  if (!forceMode) {
    console.log("⚠️  경고: 이 작업은 되돌릴 수 없습니다!");
    console.log("계속하시려면 'yes'를 입력하세요.\n");
    
    const confirmed = await askConfirmation("정말로 모든 데이터를 삭제하시겠습니까?");
    
    if (!confirmed) {
      console.log("\n❌ 작업이 취소되었습니다.\n");
      process.exit(0);
    }

    // 이중 확인 (프로덕션 환경)
    if (process.env.NODE_ENV === "production") {
      console.log("\n⚠️  프로덕션 환경입니다!");
      const doubleConfirm = await askConfirmation("정말로 프로덕션 데이터를 삭제하시겠습니까?");
      
      if (!doubleConfirm) {
        console.log("\n❌ 작업이 취소되었습니다.\n");
        process.exit(0);
      }
    }
  }

  try {
    // 모드별 실행
    if (mode === "drop") {
      await dropAndRecreate();
    } else if (mode === "truncate") {
      await truncateAllTables();
    } else {
      await quickDelete();
    }

    console.log("\n💡 다음 단계:");
    console.log("   1. 초기 데이터 입력: npm run seed");
    console.log("   2. 서버 재시작: npm start\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ 오류 발생:", error);
    process.exit(1);
  }
}

// 스크립트 실행
main();

