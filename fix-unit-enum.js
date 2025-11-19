/**
 * Items 테이블의 unit ENUM을 업데이트하는 스크립트
 * 배포 서버에서 직접 실행할 수 있습니다.
 * 
 * 사용법: node fix-unit-enum.js
 */

const db = require("./models");
const { sequelize } = db;

async function fixUnitEnum() {
  try {
    await sequelize.authenticate();
    console.log("✅ 데이터베이스 연결 성공\n");

    console.log("📋 현재 ENUM 확인 중...");
    const [currentEnum] = await sequelize.query(`
      SHOW COLUMNS FROM Items WHERE Field = 'unit'
    `);
    console.log("현재 ENUM:", currentEnum[0]?.Type || "확인 불가");
    console.log("");

    console.log("🔧 ENUM 업데이트 중...");
    await sequelize.query(`
      ALTER TABLE Items 
      MODIFY COLUMN unit ENUM('kg', 'g', 'L', 'EA', 'BOX', 'PCS', 'ROLL') 
      NOT NULL DEFAULT 'kg'
    `);
    console.log("✅ ENUM 업데이트 완료\n");

    console.log("📋 업데이트된 ENUM 확인 중...");
    const [updatedEnum] = await sequelize.query(`
      SHOW COLUMNS FROM Items WHERE Field = 'unit'
    `);
    console.log("업데이트된 ENUM:", updatedEnum[0]?.Type || "확인 불가");
    console.log("");

    console.log("🎉 완료! 이제 seedAnniecong.js를 실행할 수 있습니다.");
  } catch (error) {
    console.error("\n❌ 오류 발생:", error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

fixUnitEnum();

