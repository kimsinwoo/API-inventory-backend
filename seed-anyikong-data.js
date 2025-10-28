/**
 * 애니콩 회사 샘플 데이터 시딩
 * 실행: node seed-anyikong-data.js
 */

const db = require("./models");
const { Items, Factory, StorageCondition, User, Inventories, sequelize } = db;
const bcrypt = require("bcryptjs");
const dayjs = require("dayjs");

async function seedAnyikongData() {
  try {
    await sequelize.authenticate();
    console.log("✅ 데이터베이스 연결 성공\n");

    // 트랜잭션 시작
    const t = await sequelize.transaction();

    try {
      // ========================================
      // 1. 공장 데이터
      // ========================================
      console.log("📦 공장 데이터 추가 중...");
      await Factory.destroy({ where: {}, transaction: t });
      
      const factories = await Factory.bulkCreate([
        {
          id: 1,
          name: "애니콩 본사 공장 (서울)",
          type: "1PreProcessing",
          address: "서울특별시 강남구 테헤란로 123",
        },
        {
          id: 2,
          name: "애니콩 제조 공장 (김포)",
          type: "2Manufacturing",
          address: "경기도 김포시 김포한강11로 123",
        },
        {
          id: 3,
          name: "애니콩 포장 센터 (인천)",
          type: "3Packaging",
          address: "인천광역시 남동구 논현로 456",
        },
        {
          id: 4,
          name: "애니콩 물류 센터 (평택)",
          type: "4Distribution",
          address: "경기도 평택시 포승읍 포승공단로 789",
        },
      ], { transaction: t });
      console.log(`✓ ${factories.length}개 공장 추가 완료\n`);

      // ========================================
      // 2. 저장 조건
      // ========================================
      console.log("🌡️ 저장 조건 추가 중...");
      await StorageCondition.destroy({ where: {}, transaction: t });
      
      const conditions = await StorageCondition.bulkCreate([
        {
          id: 1,
          name: "냉동 (-18°C)",
          temperature_range: "-20°C ~ -15°C",
          humidity_range: "60-70%",
        },
        {
          id: 2,
          name: "냉장 (0-5°C)",
          temperature_range: "0°C ~ 5°C",
          humidity_range: "70-80%",
        },
        {
          id: 3,
          name: "상온 (15-25°C)",
          temperature_range: "15°C ~ 25°C",
          humidity_range: "40-60%",
        },
        {
          id: 4,
          name: "건조 보관",
          temperature_range: "10°C ~ 20°C",
          humidity_range: "30-40%",
        },
      ], { transaction: t });
      console.log(`✓ ${conditions.length}개 저장 조건 추가 완료\n`);

      // ========================================
      // 3. 사용자 데이터
      // ========================================
      console.log("👥 사용자 데이터 추가 중...");
      await User.destroy({ where: {}, transaction: t });
      
      const hashedPassword = await bcrypt.hash("anyikong123", 10);
      
      const users = await User.bulkCreate([
        {
          id: 1,
          email: "admin@anyikong.com",
          password: hashedPassword,
          name: "관리자",
          role: "ADMIN",
          department: "경영지원팀",
        },
        {
          id: 2,
          email: "manager@anyikong.com",
          password: hashedPassword,
          name: "김매니저",
          role: "MANAGER",
          department: "생산팀",
        },
        {
          id: 3,
          email: "worker@anyikong.com",
          password: hashedPassword,
          name: "이작업자",
          role: "WORKER",
          department: "물류팀",
        },
      ], { transaction: t });
      console.log(`✓ ${users.length}명 사용자 추가 완료 (비밀번호: anyikong123)\n`);

      // ========================================
      // 4. 품목 데이터 (애니콩 제품)
      // ========================================
      console.log("📋 품목 데이터 추가 중...");
      await Items.destroy({ where: {}, transaction: t });
      
      const items = await Items.bulkCreate([
        // 원재료 (콩 관련)
        {
          id: 1,
          code: "RM-001",
          name: "국산 백태 (대두)",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "건조 보관",
          shortage: 500,
          expiration_date: 365,
          wholesale_price: 8000,
        },
        {
          id: 2,
          code: "RM-002",
          name: "국산 서리태 (검은콩)",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "건조 보관",
          shortage: 300,
          expiration_date: 365,
          wholesale_price: 12000,
        },
        {
          id: 3,
          code: "RM-003",
          name: "유기농 청태 (녹두)",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "건조 보관",
          shortage: 200,
          expiration_date: 180,
          wholesale_price: 15000,
        },
        {
          id: 4,
          code: "RM-004",
          name: "천일염",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "상온",
          shortage: 100,
          expiration_date: 0,
          wholesale_price: 3000,
        },
        {
          id: 5,
          code: "RM-005",
          name: "사탕수수 설탕",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "상온",
          shortage: 150,
          expiration_date: 730,
          wholesale_price: 2500,
        },
        {
          id: 6,
          code: "RM-006",
          name: "정제수",
          category: "RawMaterial",
          unit: "L",
          factory_id: 1,
          storageTemp: "상온",
          shortage: 500,
          expiration_date: 180,
          wholesale_price: 500,
        },

        // 반제품
        {
          id: 7,
          code: "SF-001",
          name: "두부 원료 (응고 전)",
          category: "SemiFinished",
          unit: "kg",
          factory_id: 2,
          storageTemp: "냉장",
          shortage: 100,
          expiration_date: 3,
          wholesale_price: 5000,
        },
        {
          id: 8,
          code: "SF-002",
          name: "두유 베이스",
          category: "SemiFinished",
          unit: "L",
          factory_id: 2,
          storageTemp: "냉장",
          shortage: 200,
          expiration_date: 7,
          wholesale_price: 3000,
        },
        {
          id: 9,
          code: "SF-003",
          name: "콩비지",
          category: "SemiFinished",
          unit: "kg",
          factory_id: 2,
          storageTemp: "냉장",
          shortage: 50,
          expiration_date: 2,
          wholesale_price: 1000,
        },
        {
          id: 10,
          code: "SF-004",
          name: "된장 숙성 중",
          category: "SemiFinished",
          unit: "kg",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 200,
          expiration_date: 90,
          wholesale_price: 8000,
        },

        // 완제품
        {
          id: 11,
          code: "FN-001",
          name: "애니콩 프리미엄 두부 (300g)",
          category: "Finished",
          unit: "EA",
          factory_id: 3,
          storageTemp: "냉장",
          shortage: 500,
          expiration_date: 7,
          wholesale_price: 2500,
        },
        {
          id: 12,
          code: "FN-002",
          name: "애니콩 순두부 (500g)",
          category: "Finished",
          unit: "EA",
          factory_id: 3,
          storageTemp: "냉장",
          shortage: 300,
          expiration_date: 5,
          wholesale_price: 3000,
        },
        {
          id: 13,
          code: "FN-003",
          name: "애니콩 검은콩 두유 (1L)",
          category: "Finished",
          unit: "EA",
          factory_id: 3,
          storageTemp: "냉장",
          shortage: 400,
          expiration_date: 14,
          wholesale_price: 4500,
        },
        {
          id: 14,
          code: "FN-004",
          name: "애니콩 유기농 두유 (200ml)",
          category: "Finished",
          unit: "EA",
          factory_id: 3,
          storageTemp: "냉장",
          shortage: 1000,
          expiration_date: 10,
          wholesale_price: 1800,
        },
        {
          id: 15,
          code: "FN-005",
          name: "애니콩 전통 된장 (500g)",
          category: "Finished",
          unit: "EA",
          factory_id: 3,
          storageTemp: "상온",
          shortage: 200,
          expiration_date: 180,
          wholesale_price: 6000,
        },
        {
          id: 16,
          code: "FN-006",
          name: "애니콩 청국장 (300g)",
          category: "Finished",
          unit: "EA",
          factory_id: 3,
          storageTemp: "냉장",
          shortage: 150,
          expiration_date: 14,
          wholesale_price: 5500,
        },
        {
          id: 17,
          code: "FN-007",
          name: "애니콩 콩나물 (500g)",
          category: "Finished",
          unit: "EA",
          factory_id: 3,
          storageTemp: "냉장",
          shortage: 600,
          expiration_date: 3,
          wholesale_price: 2000,
        },

        // 소모품
        {
          id: 18,
          code: "SP-001",
          name: "두부 포장 용기 (300g용)",
          category: "Supply",
          unit: "EA",
          factory_id: 3,
          storageTemp: "상온",
          shortage: 2000,
          expiration_date: 0,
          wholesale_price: 150,
        },
        {
          id: 19,
          code: "SP-002",
          name: "두유 팩 (1L용)",
          category: "Supply",
          unit: "EA",
          factory_id: 3,
          storageTemp: "상온",
          shortage: 1500,
          expiration_date: 0,
          wholesale_price: 300,
        },
        {
          id: 20,
          code: "SP-003",
          name: "포장 박스 (대)",
          category: "Supply",
          unit: "EA",
          factory_id: 4,
          storageTemp: "상온",
          shortage: 500,
          expiration_date: 0,
          wholesale_price: 800,
        },
        {
          id: 21,
          code: "SP-004",
          name: "제품 라벨 스티커",
          category: "Supply",
          unit: "ROLL",
          factory_id: 3,
          storageTemp: "상온",
          shortage: 100,
          expiration_date: 0,
          wholesale_price: 15000,
        },
        {
          id: 22,
          code: "SP-005",
          name: "완충재 (에어캡)",
          category: "Supply",
          unit: "ROLL",
          factory_id: 4,
          storageTemp: "상온",
          shortage: 50,
          expiration_date: 0,
          wholesale_price: 12000,
        },
      ], { transaction: t });
      console.log(`✓ ${items.length}개 품목 추가 완료\n`);

      // ========================================
      // 5. 초기 재고 데이터
      // ========================================
      console.log("📊 초기 재고 데이터 추가 중...");
      await Inventories.destroy({ where: {}, transaction: t });
      
      const today = dayjs();
      const inventories = await Inventories.bulkCreate([
        // 원재료 재고
        {
          item_id: 1,
          factory_id: 1,
          storage_condition_id: 4,
          lot_number: "LOT-RM001-20241001",
          wholesale_price: 8000,
          quantity: 1000,
          received_at: today.subtract(10, "day").toDate(),
          first_received_at: today.subtract(10, "day").toDate(),
          expiration_date: today.add(355, "day").format("YYYY-MM-DD"),
          status: "Normal",
          unit: "kg",
        },
        {
          item_id: 2,
          factory_id: 1,
          storage_condition_id: 4,
          lot_number: "LOT-RM002-20241001",
          wholesale_price: 12000,
          quantity: 600,
          received_at: today.subtract(15, "day").toDate(),
          first_received_at: today.subtract(15, "day").toDate(),
          expiration_date: today.add(350, "day").format("YYYY-MM-DD"),
          status: "Normal",
          unit: "kg",
        },
        {
          item_id: 3,
          factory_id: 1,
          storage_condition_id: 4,
          lot_number: "LOT-RM003-20241015",
          wholesale_price: 15000,
          quantity: 150,
          received_at: today.subtract(5, "day").toDate(),
          first_received_at: today.subtract(5, "day").toDate(),
          expiration_date: today.add(175, "day").format("YYYY-MM-DD"),
          status: "LowStock",
          unit: "kg",
        },

        // 반제품 재고
        {
          item_id: 7,
          factory_id: 2,
          storage_condition_id: 2,
          lot_number: "LOT-SF001-20241027",
          wholesale_price: 5000,
          quantity: 50,
          received_at: today.subtract(1, "day").toDate(),
          first_received_at: today.subtract(1, "day").toDate(),
          expiration_date: today.add(2, "day").format("YYYY-MM-DD"),
          status: "Expiring",
          unit: "kg",
        },
        {
          item_id: 8,
          factory_id: 2,
          storage_condition_id: 2,
          lot_number: "LOT-SF002-20241026",
          wholesale_price: 3000,
          quantity: 300,
          received_at: today.subtract(2, "day").toDate(),
          first_received_at: today.subtract(2, "day").toDate(),
          expiration_date: today.add(5, "day").format("YYYY-MM-DD"),
          status: "Normal",
          unit: "L",
        },

        // 완제품 재고
        {
          item_id: 11,
          factory_id: 3,
          storage_condition_id: 2,
          lot_number: "LOT-FN001-20241025",
          wholesale_price: 2500,
          quantity: 800,
          received_at: today.subtract(3, "day").toDate(),
          first_received_at: today.subtract(3, "day").toDate(),
          expiration_date: today.add(4, "day").format("YYYY-MM-DD"),
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 12,
          factory_id: 3,
          storage_condition_id: 2,
          lot_number: "LOT-FN002-20241026",
          wholesale_price: 3000,
          quantity: 500,
          received_at: today.subtract(2, "day").toDate(),
          first_received_at: today.subtract(2, "day").toDate(),
          expiration_date: today.add(3, "day").format("YYYY-MM-DD"),
          status: "Expiring",
          unit: "EA",
        },
        {
          item_id: 13,
          factory_id: 3,
          storage_condition_id: 2,
          lot_number: "LOT-FN003-20241020",
          wholesale_price: 4500,
          quantity: 600,
          received_at: today.subtract(8, "day").toDate(),
          first_received_at: today.subtract(8, "day").toDate(),
          expiration_date: today.add(6, "day").format("YYYY-MM-DD"),
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 14,
          factory_id: 3,
          storage_condition_id: 2,
          lot_number: "LOT-FN004-20241023",
          wholesale_price: 1800,
          quantity: 1500,
          received_at: today.subtract(5, "day").toDate(),
          first_received_at: today.subtract(5, "day").toDate(),
          expiration_date: today.add(5, "day").format("YYYY-MM-DD"),
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 15,
          factory_id: 3,
          storage_condition_id: 3,
          lot_number: "LOT-FN005-20240901",
          wholesale_price: 6000,
          quantity: 300,
          received_at: today.subtract(57, "day").toDate(),
          first_received_at: today.subtract(57, "day").toDate(),
          expiration_date: today.add(123, "day").format("YYYY-MM-DD"),
          status: "Normal",
          unit: "EA",
        },

        // 소모품 재고
        {
          item_id: 18,
          factory_id: 3,
          storage_condition_id: 3,
          lot_number: "LOT-SP001-20241001",
          wholesale_price: 150,
          quantity: 5000,
          received_at: today.subtract(27, "day").toDate(),
          first_received_at: today.subtract(27, "day").toDate(),
          expiration_date: today.add(1000, "day").format("YYYY-MM-DD"),
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 19,
          factory_id: 3,
          storage_condition_id: 3,
          lot_number: "LOT-SP002-20241001",
          wholesale_price: 300,
          quantity: 3000,
          received_at: today.subtract(27, "day").toDate(),
          first_received_at: today.subtract(27, "day").toDate(),
          expiration_date: today.add(1000, "day").format("YYYY-MM-DD"),
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 20,
          factory_id: 4,
          storage_condition_id: 3,
          lot_number: "LOT-SP003-20241015",
          wholesale_price: 800,
          quantity: 200,
          received_at: today.subtract(13, "day").toDate(),
          first_received_at: today.subtract(13, "day").toDate(),
          expiration_date: today.add(1000, "day").format("YYYY-MM-DD"),
          status: "LowStock",
          unit: "EA",
        },
      ], { transaction: t });
      console.log(`✓ ${inventories.length}건 재고 데이터 추가 완료\n`);

      // 트랜잭션 커밋
      await t.commit();

      // ========================================
      // 최종 결과 출력
      // ========================================
      console.log("\n========================================");
      console.log("🎉 애니콩 데이터 시딩 완료!");
      console.log("========================================\n");

      console.log("📊 추가된 데이터:");
      console.log(`   ✓ 공장: ${factories.length}개`);
      console.log(`   ✓ 저장 조건: ${conditions.length}개`);
      console.log(`   ✓ 사용자: ${users.length}명`);
      console.log(`   ✓ 품목: ${items.length}개`);
      console.log(`   ✓ 재고: ${inventories.length}건`);

      console.log("\n👥 로그인 정보:");
      console.log("   관리자: admin@anyikong.com / anyikong123");
      console.log("   매니저: manager@anyikong.com / anyikong123");
      console.log("   작업자: worker@anyikong.com / anyikong123");

      console.log("\n🏭 공장 정보:");
      factories.forEach((f) => console.log(`   - [${f.id}] ${f.name}`));

      console.log("\n📦 품목 카테고리:");
      console.log(`   - 원재료: 6개 (콩류, 조미료)`);
      console.log(`   - 반제품: 4개 (두부원료, 두유베이스 등)`);
      console.log(`   - 완제품: 7개 (두부, 두유, 된장 등)`);
      console.log(`   - 소모품: 5개 (포장재)`);

      console.log("\n💡 다음 단계:");
      console.log("   1. 서버 시작: npm start");
      console.log("   2. 대시보드 확인: GET /api/dashboard");
      console.log("   3. 알림 확인: GET /api/notifications/summary");
      console.log("\n");

    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error("\n❌ 시딩 실패:", error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
seedAnyikongData();

