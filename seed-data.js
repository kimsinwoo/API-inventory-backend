/**
 * 테스트 데이터 시딩 스크립트
 * 실행: node seed-data.js
 */

const db = require("./models");
const { Items, Factory, StorageCondition, sequelize } = db;

async function seedData() {
  try {
    await sequelize.authenticate();
    console.log("✅ 데이터베이스 연결 성공");

    // 1. Factory 데이터 추가
    console.log("\n📦 Factory 데이터 확인 중...");
    const factories = await Factory.findAll();
    console.log(`현재 Factory 개수: ${factories.length}`);
    
    if (factories.length === 0) {
      console.log("Factory 데이터 추가 중...");
      await Factory.bulkCreate([
        { id: 1, name: "서울 공장", location: "서울특별시 강남구", capacity: 1000 },
        { id: 2, name: "부산 공장", location: "부산광역시 해운대구", capacity: 1500 },
        { id: 3, name: "대전 공장", location: "대전광역시 유성구", capacity: 800 },
      ]);
      console.log("✅ Factory 데이터 추가 완료");
    }

    // 2. StorageCondition 데이터 추가
    console.log("\n🌡️ StorageCondition 데이터 확인 중...");
    const conditions = await StorageCondition.findAll();
    console.log(`현재 StorageCondition 개수: ${conditions.length}`);
    
    if (conditions.length === 0) {
      console.log("StorageCondition 데이터 추가 중...");
      await StorageCondition.bulkCreate([
        { id: 1, name: "냉동", temperature_range: "-18°C 이하", humidity_range: "60-70%" },
        { id: 2, name: "냉장", temperature_range: "0-5°C", humidity_range: "70-80%" },
        { id: 3, name: "상온", temperature_range: "15-25°C", humidity_range: "40-60%" },
      ]);
      console.log("✅ StorageCondition 데이터 추가 완료");
    }

    // 3. Items 데이터 추가
    console.log("\n📋 Items 데이터 확인 중...");
    const items = await Items.findAll();
    console.log(`현재 Items 개수: ${items.length}`);
    
    if (items.length === 0) {
      console.log("Items 데이터 추가 중...");
      await Items.bulkCreate([
        {
          id: 1,
          code: "RM001",
          name: "프리미엄 육류",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "냉동",
          shortage: 10,
          expiration_date: 30,
          wholesale_price: 15000,
        },
        {
          id: 2,
          code: "RM002",
          name: "신선 채소",
          category: "RawMaterial",
          unit: "kg",
          factory_id: 1,
          storageTemp: "냉장",
          shortage: 5,
          expiration_date: 7,
          wholesale_price: 3000,
        },
        {
          id: 3,
          code: "SF001",
          name: "조리 반제품",
          category: "SemiFinished",
          unit: "EA",
          factory_id: 2,
          storageTemp: "냉동",
          shortage: 20,
          expiration_date: 60,
          wholesale_price: 8000,
        },
        {
          id: 4,
          code: "FN001",
          name: "완제품 도시락",
          category: "Finished",
          unit: "EA",
          factory_id: 2,
          storageTemp: "냉장",
          shortage: 50,
          expiration_date: 3,
          wholesale_price: 5000,
        },
        {
          id: 5,
          code: "SP001",
          name: "포장 용기",
          category: "Supply",
          unit: "BOX",
          factory_id: 1,
          storageTemp: "상온",
          shortage: 100,
          expiration_date: 0,
          wholesale_price: 500,
        },
      ]);
      console.log("✅ Items 데이터 추가 완료");
    }

    // 최종 결과 출력
    console.log("\n========== 데이터 확인 ==========");
    const finalFactories = await Factory.findAll();
    const finalConditions = await StorageCondition.findAll();
    const finalItems = await Items.findAll();
    
    console.log(`\n✅ Factory: ${finalFactories.length}개`);
    finalFactories.forEach(f => console.log(`   - [${f.id}] ${f.name}`));
    
    console.log(`\n✅ StorageCondition: ${finalConditions.length}개`);
    finalConditions.forEach(c => console.log(`   - [${c.id}] ${c.name}`));
    
    console.log(`\n✅ Items: ${finalItems.length}개`);
    finalItems.forEach(i => console.log(`   - [${i.id}] ${i.code} - ${i.name}`));
    
    console.log("\n🎉 시딩 완료!");
    
  } catch (error) {
    console.error("❌ 에러 발생:", error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

seedData();

