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
          name: "1공장",
          type: "1PreProcessing",
          address: "경상북도 의성군 안계면 용기5길 12",
        },
        {
          id: 2,
          name: "2공장",
          type: "2Manufacturing",
          address: "경상북도 상주시 냉림1길 66",
        },
        {
          id: 3,
          name: "1창고",
          type: "Warehouse",
          address: "경상북도 의성군 안계면 용기5길 12",
        },
        {
          id: 4,
          name: "2창고",
          type: "Warehouse",
          address: "경상북도 상주시 냉림1길 66",
        }
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
          name: "상온 보관",
          temperature_range: "15°C ~ 25°C",
          humidity_range: "40-60%",
          applicable_items: "완제품, 냉동 육류",
        },
        {
          id: 2,
          name: "냉장 보관",
          temperature_range: "0°C ~ 4°C",
          humidity_range: "85-95%",
          applicable_items: "신선 육류, 야채류, 반제품품",
        },
        {
          id: 3,
          name: "냉동 보관",
          temperature_range: "-18°C 이하",
          humidity_range: "N/A",
          applicable_items: "건조 사료, 포장재",
        },


      ], { transaction: t });
      console.log(`✓ ${conditions.length}개 저장 조건 추가 완료\n`);
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

