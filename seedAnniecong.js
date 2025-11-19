/**
 * 애니콩(Anniecong) 강아지 음식 제조 회사 샘플 데이터 시딩
 * 실행: node seedAnniecong.js
 * 
 * 주의: auth 관련 데이터(사용자, 역할 등)는 제외됩니다.
 */

const db = require("./models");
const { Items, Factory, StorageCondition, Inventories, sequelize } = db;
const dayjs = require("dayjs");
const { generateBarcode } = require("./src/utils/barcodeGenerator");

async function seedAnniecongData() {
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
          name: "애니콩 원료 전처리 공장",
          type: "1PreProcessing",
          address: "경상북도 의성군 안계면 용기5길 12",
        },
        {
          id: 2,
          name: "애니콩 사료 제조 공장",
          type: "2Manufacturing",
          address: "경북 상주시 냉림1길 66",
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
          temperature_range: "20°C ~ 25°C",
          humidity_range: "20-30%",
        },
      ], { transaction: t });
      console.log(`✓ ${conditions.length}개 저장 조건 추가 완료\n`);

      // ========================================
      // 3. 품목 데이터 (강아지 음식 제조 관련)
      // ========================================
      console.log("📋 품목 데이터 추가 중...");
      await Items.destroy({ where: {}, transaction: t });
      
      const items = await Items.bulkCreate([
        // 원재료 - 육류
        {
          id: 1,
          code: "RM-001",
          name: "닭고기 (무항생제)",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "냉동",
          shortage: 500,
          expiration_date: 180,
          wholesale_price: 12000,
        },
        {
          id: 2,
          code: "RM-002",
          name: "소고기 (한우)",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "냉동",
          shortage: 300,
          expiration_date: 180,
          wholesale_price: 25000,
        },
        {
          id: 3,
          code: "RM-003",
          name: "연어 (생선)",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "냉동",
          shortage: 200,
          expiration_date: 90,
          wholesale_price: 18000,
        },
        {
          id: 4,
          code: "RM-004",
          name: "오리고기",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "냉동",
          shortage: 250,
          expiration_date: 180,
          wholesale_price: 15000,
        },
        
        // 원재료 - 채소/과일
        {
          id: 5,
          code: "RM-005",
          name: "고구마 (건조)",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "상온",
          shortage: 400,
          expiration_date: 365,
          wholesale_price: 3000,
        },
        {
          id: 6,
          code: "RM-006",
          name: "당근 (신선)",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "냉장",
          shortage: 300,
          expiration_date: 14,
          wholesale_price: 2500,
        },
        {
          id: 7,
          code: "RM-007",
          name: "브로콜리 (냉동)",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "냉동",
          shortage: 200,
          expiration_date: 180,
          wholesale_price: 4000,
        },
        {
          id: 8,
          code: "RM-008",
          name: "사과 (건조)",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "상온",
          shortage: 150,
          expiration_date: 365,
          wholesale_price: 5000,
        },
        
        // 원재료 - 곡물
        {
          id: 9,
          code: "RM-009",
          name: "현미 (갈색쌀)",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "상온",
          shortage: 600,
          expiration_date: 365,
          wholesale_price: 3500,
        },
        {
          id: 10,
          code: "RM-010",
          name: "귀리 (오트밀)",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "상온",
          shortage: 500,
          expiration_date: 365,
          wholesale_price: 2800,
        },
        {
          id: 11,
          code: "RM-011",
          name: "보리",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "상온",
          shortage: 400,
          expiration_date: 365,
          wholesale_price: 2500,
        },
        
        // 원재료 - 영양제/첨가물
        {
          id: 12,
          code: "RM-012",
          name: "오메가3 오일",
          category: "RawMaterial",
          unit: "L",
          factory_id: 1,
          storageTemp: "냉장",
          shortage: 100,
          expiration_date: 180,
          wholesale_price: 15000,
        },
        {
          id: 13,
          code: "RM-013",
          name: "비타민 복합제",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "상온",
          shortage: 50,
          expiration_date: 730,
          wholesale_price: 80000,
        },
        {
          id: 14,
          code: "RM-014",
          name: "칼슘 파우더",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "상온",
          shortage: 80,
          expiration_date: 730,
          wholesale_price: 12000,
        },

        // 반제품
        {
          id: 15,
          code: "SF-001",
          name: "다진 닭고기 혼합물",
          category: "SemiFinished",
          unit: "kg",
          factory_id: 2,
          storageTemp: "냉동",
          shortage: 200,
          expiration_date: 30,
          wholesale_price: 15000,
        },
        {
          id: 16,
          code: "SF-002",
          name: "육류+채소 믹스",
          category: "SemiFinished",
          unit: "kg",
          factory_id: 2,
          storageTemp: "냉동",
          shortage: 150,
          expiration_date: 21,
          wholesale_price: 18000,
        },
        {
          id: 17,
          code: "SF-003",
          name: "사료 반죽 (건조 전)",
          category: "SemiFinished",
          unit: "kg",
          factory_id: 2,
          storageTemp: "냉장",
          shortage: 100,
          expiration_date: 3,
          wholesale_price: 12000,
        },
        {
          id: 18,
          code: "SF-004",
          name: "습식 사료 베이스",
          category: "SemiFinished",
          unit: "kg",
          factory_id: 2,
          storageTemp: "냉장",
          shortage: 120,
          expiration_date: 5,
          wholesale_price: 10000,
        },

        // 완제품 - 건식 사료
        {
          id: 19,
          code: "FN-001",
          name: "애니콩 프리미엄 건식사료 (닭고기) 2kg",
          category: "Finished",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 1000,
          expiration_date: 365,
          wholesale_price: 12000,
        },
        {
          id: 20,
          code: "FN-002",
          name: "애니콩 프리미엄 건식사료 (연어) 2kg",
          category: "Finished",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 800,
          expiration_date: 365,
          wholesale_price: 15000,
        },
        {
          id: 21,
          code: "FN-003",
          name: "애니콩 프리미엄 건식사료 (소고기) 2kg",
          category: "Finished",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 600,
          expiration_date: 365,
          wholesale_price: 18000,
        },
        {
          id: 22,
          code: "FN-004",
          name: "애니콩 프리미엄 건식사료 (닭고기) 10kg",
          category: "Finished",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 500,
          expiration_date: 365,
          wholesale_price: 50000,
        },
        
        // 완제품 - 습식 사료
        {
          id: 23,
          code: "FN-005",
          name: "애니콩 습식사료 (닭고기) 400g",
          category: "Finished",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 2000,
          expiration_date: 730,
          wholesale_price: 2500,
        },
        {
          id: 24,
          code: "FN-006",
          name: "애니콩 습식사료 (연어) 400g",
          category: "Finished",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 1500,
          expiration_date: 730,
          wholesale_price: 3000,
        },
        {
          id: 25,
          code: "FN-007",
          name: "애니콩 습식사료 (소고기) 400g",
          category: "Finished",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 1200,
          expiration_date: 730,
          wholesale_price: 3500,
        },
        
        // 완제품 - 간식
        {
          id: 26,
          code: "FN-008",
          name: "애니콩 닭가슴살 간식 100g",
          category: "Finished",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 3000,
          expiration_date: 365,
          wholesale_price: 5000,
        },
        {
          id: 27,
          code: "FN-009",
          name: "애니콩 소고기 말린 간식 200g",
          category: "Finished",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 2500,
          expiration_date: 365,
          wholesale_price: 8000,
        },
        {
          id: 28,
          code: "FN-010",
          name: "애니콩 치약용 간식 50g",
          category: "Finished",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 4000,
          expiration_date: 365,
          wholesale_price: 3000,
        },
        {
          id: 29,
          code: "FN-011",
          name: "애니콩 고구마 간식 150g",
          category: "Finished",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 2000,
          expiration_date: 365,
          wholesale_price: 4000,
        },

        // 소모품
        {
          id: 30,
          code: "SP-001",
          name: "사료 포장 봉투 (2kg용)",
          category: "Supply",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 5000,
          expiration_date: 0,
          wholesale_price: 200,
        },
        {
          id: 31,
          code: "SP-002",
          name: "사료 포장 봉투 (10kg용)",
          category: "Supply",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 2000,
          expiration_date: 0,
          wholesale_price: 500,
        },
        {
          id: 32,
          code: "SP-003",
          name: "습식사료 캔 (400g용)",
          category: "Supply",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 10000,
          expiration_date: 0,
          wholesale_price: 150,
        },
        {
          id: 33,
          code: "SP-004",
          name: "제품 라벨 스티커",
          category: "Supply",
          unit: "ROLL",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 200,
          expiration_date: 0,
          wholesale_price: 20000,
        },
        {
          id: 34,
          code: "SP-005",
          name: "포장 박스 (대형)",
          category: "Supply",
          unit: "EA",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 1000,
          expiration_date: 0,
          wholesale_price: 1000,
        },
        {
          id: 35,
          code: "SP-006",
          name: "완충재 (에어캡)",
          category: "Supply",
          unit: "ROLL",
          factory_id: 2,
          storageTemp: "상온",
          shortage: 100,
          expiration_date: 0,
          wholesale_price: 15000,
        },
      ], { transaction: t });
      console.log(`✓ ${items.length}개 품목 추가 완료\n`);

      // ========================================
      // 4. 초기 재고 데이터
      // ========================================
      console.log("📊 초기 재고 데이터 추가 중...");
      await Inventories.destroy({ where: {}, transaction: t });
      
      const today = dayjs();
      
      // 재고 데이터 생성 (바코드 포함)
      const inventoryData = [
        // 원재료 재고 - 육류
        {
          item_id: 1,
          factory_id: 1,
          storage_condition_id: 1,
          received_at: today.subtract(5, "day").toDate(),
          first_received_at: today.subtract(5, "day").toDate(),
          expiration_date: today.add(175, "day").format("YYYY-MM-DD"),
          wholesale_price: 12000,
          quantity: 2000,
          status: "Normal",
          unit: "kg",
        },
        {
          item_id: 2,
          factory_id: 1,
          storage_condition_id: 1,
          received_at: today.subtract(12, "day").toDate(),
          first_received_at: today.subtract(12, "day").toDate(),
          expiration_date: today.add(168, "day").format("YYYY-MM-DD"),
          wholesale_price: 25000,
          quantity: 800,
          status: "Normal",
          unit: "kg",
        },
        {
          item_id: 3,
          factory_id: 1,
          storage_condition_id: 1,
          received_at: today.subtract(1, "day").toDate(),
          first_received_at: today.subtract(1, "day").toDate(),
          expiration_date: today.add(89, "day").format("YYYY-MM-DD"),
          wholesale_price: 18000,
          quantity: 500,
          status: "Normal",
          unit: "kg",
        },
        {
          item_id: 4,
          factory_id: 1,
          storage_condition_id: 1,
          received_at: today.subtract(17, "day").toDate(),
          first_received_at: today.subtract(17, "day").toDate(),
          expiration_date: today.add(163, "day").format("YYYY-MM-DD"),
          wholesale_price: 15000,
          quantity: 600,
          status: "Normal",
          unit: "kg",
        },
        
        // 원재료 재고 - 채소
        {
          item_id: 6,
          factory_id: 1,
          storage_condition_id: 2,
          received_at: today.subtract(3, "day").toDate(),
          first_received_at: today.subtract(3, "day").toDate(),
          expiration_date: today.add(11, "day").format("YYYY-MM-DD"),
          wholesale_price: 2500,
          quantity: 800,
          status: "Normal",
          unit: "kg",
        },
        {
          item_id: 7,
          factory_id: 1,
          storage_condition_id: 1,
          received_at: today.subtract(22, "day").toDate(),
          first_received_at: today.subtract(22, "day").toDate(),
          expiration_date: today.add(158, "day").format("YYYY-MM-DD"),
          wholesale_price: 4000,
          quantity: 500,
          status: "Normal",
          unit: "kg",
        },
        
        // 원재료 재고 - 곡물
        {
          item_id: 9,
          factory_id: 1,
          storage_condition_id: 4,
          received_at: today.subtract(36, "day").toDate(),
          first_received_at: today.subtract(36, "day").toDate(),
          expiration_date: today.add(329, "day").format("YYYY-MM-DD"),
          wholesale_price: 3500,
          quantity: 1500,
          status: "Normal",
          unit: "kg",
        },
        {
          item_id: 10,
          factory_id: 1,
          storage_condition_id: 4,
          received_at: today.subtract(27, "day").toDate(),
          first_received_at: today.subtract(27, "day").toDate(),
          expiration_date: today.add(338, "day").format("YYYY-MM-DD"),
          wholesale_price: 2800,
          quantity: 1200,
          status: "Normal",
          unit: "kg",
        },
        
        // 원재료 재고 - 영양제
        {
          item_id: 12,
          factory_id: 1,
          storage_condition_id: 2,
          received_at: today.subtract(17, "day").toDate(),
          first_received_at: today.subtract(17, "day").toDate(),
          expiration_date: today.add(163, "day").format("YYYY-MM-DD"),
          wholesale_price: 15000,
          quantity: 300,
          status: "Normal",
          unit: "L",
        },
        {
          item_id: 13,
          factory_id: 1,
          storage_condition_id: 4,
          received_at: today.subtract(56, "day").toDate(),
          first_received_at: today.subtract(56, "day").toDate(),
          expiration_date: today.add(674, "day").format("YYYY-MM-DD"),
          wholesale_price: 80000,
          quantity: 150,
          status: "Normal",
          unit: "kg",
        },

        // 반제품 재고
        {
          item_id: 15,
          factory_id: 2,
          storage_condition_id: 1,
          received_at: today.subtract(2, "day").toDate(),
          first_received_at: today.subtract(2, "day").toDate(),
          expiration_date: today.add(28, "day").format("YYYY-MM-DD"),
          wholesale_price: 15000,
          quantity: 500,
          status: "Normal",
          unit: "kg",
        },
        {
          item_id: 16,
          factory_id: 2,
          storage_condition_id: 1,
          received_at: today.subtract(7, "day").toDate(),
          first_received_at: today.subtract(7, "day").toDate(),
          expiration_date: today.add(14, "day").format("YYYY-MM-DD"),
          wholesale_price: 18000,
          quantity: 400,
          status: "Normal",
          unit: "kg",
        },
        {
          item_id: 17,
          factory_id: 2,
          storage_condition_id: 2,
          received_at: today.subtract(1, "day").toDate(),
          first_received_at: today.subtract(1, "day").toDate(),
          expiration_date: today.add(2, "day").format("YYYY-MM-DD"),
          wholesale_price: 12000,
          quantity: 300,
          status: "Expiring",
          unit: "kg",
        },

        // 완제품 재고 - 건식 사료
        {
          item_id: 19,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(17, "day").toDate(),
          first_received_at: today.subtract(17, "day").toDate(),
          expiration_date: today.add(348, "day").format("YYYY-MM-DD"),
          wholesale_price: 12000,
          quantity: 2000,
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 20,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(12, "day").toDate(),
          first_received_at: today.subtract(12, "day").toDate(),
          expiration_date: today.add(353, "day").format("YYYY-MM-DD"),
          wholesale_price: 15000,
          quantity: 1500,
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 21,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(22, "day").toDate(),
          first_received_at: today.subtract(22, "day").toDate(),
          expiration_date: today.add(343, "day").format("YYYY-MM-DD"),
          wholesale_price: 18000,
          quantity: 1000,
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 22,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(27, "day").toDate(),
          first_received_at: today.subtract(27, "day").toDate(),
          expiration_date: today.add(338, "day").format("YYYY-MM-DD"),
          wholesale_price: 50000,
          quantity: 800,
          status: "Normal",
          unit: "EA",
        },
        
        // 완제품 재고 - 습식 사료
        {
          item_id: 23,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(52, "day").toDate(),
          first_received_at: today.subtract(52, "day").toDate(),
          expiration_date: today.add(678, "day").format("YYYY-MM-DD"),
          wholesale_price: 2500,
          quantity: 5000,
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 24,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(47, "day").toDate(),
          first_received_at: today.subtract(47, "day").toDate(),
          expiration_date: today.add(683, "day").format("YYYY-MM-DD"),
          wholesale_price: 3000,
          quantity: 4000,
          status: "Normal",
          unit: "EA",
        },
        
        // 완제품 재고 - 간식
        {
          item_id: 26,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(36, "day").toDate(),
          first_received_at: today.subtract(36, "day").toDate(),
          expiration_date: today.add(329, "day").format("YYYY-MM-DD"),
          wholesale_price: 5000,
          quantity: 6000,
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 27,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(32, "day").toDate(),
          first_received_at: today.subtract(32, "day").toDate(),
          expiration_date: today.add(333, "day").format("YYYY-MM-DD"),
          wholesale_price: 8000,
          quantity: 5000,
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 28,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(27, "day").toDate(),
          first_received_at: today.subtract(27, "day").toDate(),
          expiration_date: today.add(338, "day").format("YYYY-MM-DD"),
          wholesale_price: 3000,
          quantity: 8000,
          status: "Normal",
          unit: "EA",
        },

        // 소모품 재고
        {
          item_id: 30,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(36, "day").toDate(),
          first_received_at: today.subtract(36, "day").toDate(),
          expiration_date: today.add(1000, "day").format("YYYY-MM-DD"),
          wholesale_price: 200,
          quantity: 10000,
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 31,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(36, "day").toDate(),
          first_received_at: today.subtract(36, "day").toDate(),
          expiration_date: today.add(1000, "day").format("YYYY-MM-DD"),
          wholesale_price: 500,
          quantity: 5000,
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 32,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(22, "day").toDate(),
          first_received_at: today.subtract(22, "day").toDate(),
          expiration_date: today.add(1000, "day").format("YYYY-MM-DD"),
          wholesale_price: 150,
          quantity: 20000,
          status: "Normal",
          unit: "EA",
        },
        {
          item_id: 33,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(36, "day").toDate(),
          first_received_at: today.subtract(36, "day").toDate(),
          expiration_date: today.add(1000, "day").format("YYYY-MM-DD"),
          wholesale_price: 20000,
          quantity: 500,
          status: "Normal",
          unit: "ROLL",
        },
        {
          item_id: 34,
          factory_id: 2,
          storage_condition_id: 4,
          received_at: today.subtract(17, "day").toDate(),
          first_received_at: today.subtract(17, "day").toDate(),
          expiration_date: today.add(1000, "day").format("YYYY-MM-DD"),
          wholesale_price: 1000,
          quantity: 2000,
          status: "Normal",
          unit: "EA",
        },
      ];

      // 각 재고 항목에 고유한 바코드 추가
      // 각 항목마다 고유한 바코드를 생성하기 위해 인덱스를 타임스탬프에 추가
      const baseTimestamp = Date.now();
      const inventories = await Inventories.bulkCreate(
        inventoryData.map((inv, index) => {
          // 각 항목마다 고유한 타임스탬프 생성 (인덱스를 더하여 고유성 보장)
          const timestamp = baseTimestamp + index;
          // 체크섬 계산
          const checksum = String(timestamp)
            .split('')
            .reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10;
          // 14자리 바코드: 타임스탬프(13) + 체크섬(1)
          const barcode = `${timestamp}${checksum}`;
          
          return {
            ...inv,
            barcode: barcode,
          };
        }),
        { transaction: t }
      );
      console.log(`✓ ${inventories.length}건 재고 데이터 추가 완료\n`);

      // 트랜잭션 커밋
      await t.commit();

      // ========================================
      // 최종 결과 출력
      // ========================================
      console.log("\n========================================");
      console.log("🎉 애니콩(Anniecong) 데이터 시딩 완료!");
      console.log("========================================\n");

      console.log("📊 추가된 데이터:");
      console.log(`   ✓ 공장: ${factories.length}개`);
      console.log(`   ✓ 저장 조건: ${conditions.length}개`);
      console.log(`   ✓ 품목: ${items.length}개`);
      console.log(`   ✓ 재고: ${inventories.length}건\n`);

      console.log("🏭 공장 정보:");
      factories.forEach((f) => console.log(`   - [${f.id}] ${f.name}`));

      console.log("\n📦 품목 카테고리:");
      const rawMaterials = items.filter(i => i.category === "RawMaterial").length;
      const semiFinished = items.filter(i => i.category === "SemiFinished").length;
      const finished = items.filter(i => i.category === "Finished").length;
      const supplies = items.filter(i => i.category === "Supply").length;
      console.log(`   - 원재료: ${rawMaterials}개 (육류, 채소, 곡물, 영양제)`);
      console.log(`   - 반제품: ${semiFinished}개 (다진 고기, 혼합물, 반죽)`);
      console.log(`   - 완제품: ${finished}개 (건식사료, 습식사료, 간식)`);
      console.log(`   - 소모품: ${supplies}개 (포장재, 라벨)`);

      console.log("\n💡 다음 단계:");
      console.log("   1. 서버 시작: npm start");
      console.log("   2. 대시보드 확인: GET /api/dashboard");
      console.log("   3. 재고 조회: GET /api/inventories");
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
seedAnniecongData();

