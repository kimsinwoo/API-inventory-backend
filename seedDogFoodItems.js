/**
 * 강아지 간식, 사료 관련 품목 데이터 시딩 (40개)
 * 실행: node seedDogFoodItems.js
 * 
 * 다양한 카테고리, 상태, 재고량을 포함한 샘플 데이터 생성
 */

const db = require("./models");
const { Items, Factory, StorageCondition, Inventories, BOM, BOMComponent, sequelize } = db;
const dayjs = require("dayjs");
const { generateBarcode } = require("./src/utils/barcodeGenerator");

// 품목 데이터 (40개)
const itemsData = [
  // 원재료 (RawMaterial) - 10개
  { code: "RAW001", name: "닭가슴살", category: "RawMaterial", unit: "kg", factory_id: 1, storage_condition_id: 2, shortage: 50, expiration_date: 365, wholesale_price: 8000 },
  { code: "RAW002", name: "소고기", category: "RawMaterial", unit: "kg", factory_id: 1, storage_condition_id: 2, shortage: 30, expiration_date: 180, wholesale_price: 15000 },
  { code: "RAW003", name: "연어", category: "RawMaterial", unit: "kg", factory_id: 1, storage_condition_id: 2, shortage: 20, expiration_date: 180, wholesale_price: 12000 },
  { code: "RAW004", name: "당근", category: "RawMaterial", unit: "kg", factory_id: 1, storage_condition_id: 2, shortage: 100, expiration_date: 30, wholesale_price: 2000 },
  { code: "RAW005", name: "고구마", category: "RawMaterial", unit: "kg", factory_id: 1, storage_condition_id: 1, shortage: 80, expiration_date: 60, wholesale_price: 1500 },
  { code: "RAW006", name: "현미", category: "RawMaterial", unit: "kg", factory_id: 1, storage_condition_id: 1, shortage: 200, expiration_date: 365, wholesale_price: 3000 },
  { code: "RAW007", name: "옥수수", category: "RawMaterial", unit: "kg", factory_id: 1, storage_condition_id: 1, shortage: 150, expiration_date: 180, wholesale_price: 2500 },
  { code: "RAW008", name: "닭 간", category: "RawMaterial", unit: "kg", factory_id: 1, storage_condition_id: 2, shortage: 25, expiration_date: 90, wholesale_price: 5000 },
  { code: "RAW009", name: "계란", category: "RawMaterial", unit: "EA", factory_id: 1, storage_condition_id: 2, shortage: 500, expiration_date: 30, wholesale_price: 200 },
  { code: "RAW010", name: "오메가3 오일", category: "RawMaterial", unit: "L", factory_id: 1, storage_condition_id: 1, shortage: 20, expiration_date: 730, wholesale_price: 25000 },

  // 반제품 (SemiFinished) - 10개
  { code: "SEM001", name: "다진 닭고기", category: "SemiFinished", unit: "kg", factory_id: 1, storage_condition_id: 2, shortage: 40, expiration_date: 7, wholesale_price: 10000 },
  { code: "SEM002", name: "혼합 야채 믹스", category: "SemiFinished", unit: "kg", factory_id: 1, storage_condition_id: 2, shortage: 60, expiration_date: 5, wholesale_price: 4000 },
  { code: "SEM003", name: "고기 반죽", category: "SemiFinished", unit: "kg", factory_id: 1, storage_condition_id: 2, shortage: 50, expiration_date: 3, wholesale_price: 12000 },
  { code: "SEM004", name: "곡물 혼합물", category: "SemiFinished", unit: "kg", factory_id: 1, storage_condition_id: 1, shortage: 100, expiration_date: 90, wholesale_price: 3500 },
  { code: "SEM005", name: "육수", category: "SemiFinished", unit: "L", factory_id: 1, storage_condition_id: 2, shortage: 30, expiration_date: 7, wholesale_price: 6000 },
  { code: "SEM006", name: "건조 과일 믹스", category: "SemiFinished", unit: "kg", factory_id: 1, storage_condition_id: 1, shortage: 40, expiration_date: 180, wholesale_price: 8000 },
  { code: "SEM007", name: "단백질 파우더", category: "SemiFinished", unit: "kg", factory_id: 1, storage_condition_id: 1, shortage: 30, expiration_date: 365, wholesale_price: 15000 },
  { code: "SEM008", name: "비타민 혼합물", category: "SemiFinished", unit: "g", factory_id: 1, storage_condition_id: 1, shortage: 500, expiration_date: 730, wholesale_price: 50000 },
  { code: "SEM009", name: "저지방 요구르트", category: "SemiFinished", unit: "L", factory_id: 1, storage_condition_id: 2, shortage: 25, expiration_date: 14, wholesale_price: 7000 },
  { code: "SEM010", name: "건조 고기 스트립", category: "SemiFinished", unit: "kg", factory_id: 1, storage_condition_id: 1, shortage: 35, expiration_date: 365, wholesale_price: 18000 },

  // 완제품 (Finished) - 15개
  { code: "FIN001", name: "프리미엄 건식사료 15kg", category: "Finished", unit: "BOX", factory_id: 2, storage_condition_id: 1, shortage: 20, expiration_date: 365, wholesale_price: 45000 },
  { code: "FIN002", name: "프리미엄 건식사료 7kg", category: "Finished", unit: "BOX", factory_id: 2, storage_condition_id: 1, shortage: 30, expiration_date: 365, wholesale_price: 25000 },
  { code: "FIN003", name: "습식사료 캔 400g", category: "Finished", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 500, expiration_date: 730, wholesale_price: 2500 },
  { code: "FIN004", name: "습식사료 파우치 100g", category: "Finished", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 1000, expiration_date: 730, wholesale_price: 800 },
  { code: "FIN005", name: "닭고기 간식 스틱", category: "Finished", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 800, expiration_date: 365, wholesale_price: 1500 },
  { code: "FIN006", name: "소고기 저키", category: "Finished", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 600, expiration_date: 365, wholesale_price: 2000 },
  { code: "FIN007", name: "연어 오메가3 간식", category: "Finished", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 400, expiration_date: 365, wholesale_price: 3000 },
  { code: "FIN008", name: "치약 기능성 간식", category: "Finished", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 500, expiration_date: 180, wholesale_price: 2500 },
  { code: "FIN009", name: "프리미엄 건식사료 3kg", category: "Finished", unit: "BOX", factory_id: 2, storage_condition_id: 1, shortage: 50, expiration_date: 365, wholesale_price: 12000 },
  { code: "FIN010", name: "고구마 간식", category: "Finished", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 700, expiration_date: 180, wholesale_price: 1000 },
  { code: "FIN011", name: "닭가슴살 큐브", category: "Finished", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 600, expiration_date: 365, wholesale_price: 1800 },
  { code: "FIN012", name: "프리미엄 건식사료 1kg", category: "Finished", unit: "BOX", factory_id: 2, storage_condition_id: 1, shortage: 100, expiration_date: 365, wholesale_price: 5000 },
  { code: "FIN013", name: "연어 습식사료 200g", category: "Finished", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 800, expiration_date: 730, wholesale_price: 1500 },
  { code: "FIN014", name: "닭고기 습식사료 200g", category: "Finished", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 900, expiration_date: 730, wholesale_price: 1400 },
  { code: "FIN015", name: "소고기 습식사료 200g", category: "Finished", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 750, expiration_date: 730, wholesale_price: 1600 },

  // 소모품 (Supply) - 5개
  { code: "SUP001", name: "사료 포장재 15kg", category: "Supply", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 200, expiration_date: 0, wholesale_price: 500 },
  { code: "SUP002", name: "사료 포장재 7kg", category: "Supply", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 300, expiration_date: 0, wholesale_price: 300 },
  { code: "SUP003", name: "캔 라벨", category: "Supply", unit: "ROLL", factory_id: 2, storage_condition_id: 1, shortage: 50, expiration_date: 0, wholesale_price: 15000 },
  { code: "SUP004", name: "파우치 포장재", category: "Supply", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 5000, expiration_date: 0, wholesale_price: 50 },
  { code: "SUP005", name: "박스 포장재", category: "Supply", unit: "PCS", factory_id: 2, storage_condition_id: 1, shortage: 1000, expiration_date: 0, wholesale_price: 200 },
];

// BOM 데이터
const bomData = [
  { name: "프리미엄 건식사료 15kg BOM", description: "프리미엄 건식사료 15kg 제조 레시피" },
  { name: "프리미엄 건식사료 7kg BOM", description: "프리미엄 건식사료 7kg 제조 레시피" },
  { name: "습식사료 캔 BOM", description: "습식사료 캔 제조 레시피" },
  { name: "닭고기 간식 스틱 BOM", description: "닭고기 간식 스틱 제조 레시피" },
];

// 상태별 날짜 생성 함수
function getDateByStatus(status, baseDate = dayjs()) {
  switch(status) {
    case "Expired":
      return baseDate.subtract(5, "day").format("YYYY-MM-DD");
    case "Expiring":
      return baseDate.add(2, "day").format("YYYY-MM-DD");
    case "LowStock":
      return baseDate.add(30, "day").format("YYYY-MM-DD");
    default: // Normal
      return baseDate.add(90, "day").format("YYYY-MM-DD");
  }
}

// 재고 상태 결정 함수
function determineStatus(quantity, shortage, expirationDate) {
  const daysLeft = dayjs(expirationDate).diff(dayjs(), "day");
  const isLowStock = quantity < shortage;
  const isExpiring = daysLeft <= 3 && daysLeft >= 0;
  const isExpired = daysLeft < 0;
  
  if (isExpired) return "Expired";
  if (isExpiring) return "Expiring";
  if (isLowStock) return "LowStock";
  return "Normal";
}

async function seedDogFoodItems() {
  try {
    await sequelize.authenticate();
    console.log("✅ 데이터베이스 연결 성공\n");

    const t = await sequelize.transaction();

    try {
      // 공장과 저장 조건 확인
      const factories = await Factory.findAll({ transaction: t });
      const storageConditions = await StorageCondition.findAll({ transaction: t });

      if (factories.length === 0 || storageConditions.length === 0) {
        console.log("⚠️ 공장 또는 저장 조건이 없습니다. seedAnniecong.js를 먼저 실행하세요.");
        await t.rollback();
        return;
      }

      console.log("📦 품목 데이터 추가 중...");
      await Items.destroy({ where: {}, transaction: t });
      
      const createdItems = await Items.bulkCreate(itemsData, { transaction: t });
      console.log(`✓ ${createdItems.length}개 품목 추가 완료\n`);

      // BOM 생성
      console.log("📋 BOM 데이터 추가 중...");
      await BOM.destroy({ where: {}, transaction: t });
      await BOMComponent.destroy({ where: {}, transaction: t });

      const createdBOMs = await BOM.bulkCreate(bomData, { transaction: t });
      
      // BOM 컴포넌트 연결 (예시)
      const bomComponents = [
        { bom_id: createdBOMs[0].id, item_id: createdItems.find(i => i.code === "RAW001").id, quantity: 5.0, unit: "kg", sort_order: 1, loss_rate: 0.05 },
        { bom_id: createdBOMs[0].id, item_id: createdItems.find(i => i.code === "RAW004").id, quantity: 2.0, unit: "kg", sort_order: 2, loss_rate: 0.03 },
        { bom_id: createdBOMs[0].id, item_id: createdItems.find(i => i.code === "RAW006").id, quantity: 8.0, unit: "kg", sort_order: 3, loss_rate: 0.02 },
        { bom_id: createdBOMs[1].id, item_id: createdItems.find(i => i.code === "RAW001").id, quantity: 2.5, unit: "kg", sort_order: 1, loss_rate: 0.05 },
        { bom_id: createdBOMs[1].id, item_id: createdItems.find(i => i.code === "RAW004").id, quantity: 1.0, unit: "kg", sort_order: 2, loss_rate: 0.03 },
        { bom_id: createdBOMs[1].id, item_id: createdItems.find(i => i.code === "RAW006").id, quantity: 3.5, unit: "kg", sort_order: 3, loss_rate: 0.02 },
      ];

      await BOMComponent.bulkCreate(bomComponents, { transaction: t });
      console.log(`✓ ${createdBOMs.length}개 BOM 추가 완료\n`);

      // 완제품에 BOM 연결
      const finishedItems = createdItems.filter(item => item.category === "Finished");
      for (let i = 0; i < Math.min(finishedItems.length, createdBOMs.length); i++) {
        await finishedItems[i].update({ bom_id: createdBOMs[i].id }, { transaction: t });
      }

      // 재고 데이터 생성
      console.log("📊 재고 데이터 추가 중...");
      await Inventories.destroy({ where: {}, transaction: t });

      const inventoryData = [];
      const statuses = ["Normal", "LowStock", "Expiring", "Expired"];
      let inventoryIndex = 0; // 재고 인덱스 (고유 바코드 생성을 위해)
      
      createdItems.forEach((item, index) => {
        const status = statuses[index % statuses.length];
        const baseDate = dayjs();
        const expirationDate = getDateByStatus(status, baseDate);
        const receivedAt = baseDate.subtract(10, "day").toDate();
        const firstReceivedAt = baseDate.subtract(15, "day").toDate();
        
        // 재고량 설정 (상태에 따라 다양하게)
        let quantity;
        switch(status) {
          case "LowStock":
            quantity = (item.shortage * 0.5).toFixed(2); // 부족 상태
            break;
          case "Expired":
            quantity = (item.shortage * 1.5).toFixed(2); // 만료되었지만 재고는 있음
            break;
          case "Expiring":
            quantity = (item.shortage * 2).toFixed(2); // 임박 상태
            break;
          default:
            quantity = (item.shortage * (3 + Math.random() * 5)).toFixed(2); // 정상 상태 (다양한 수량)
        }

        // 고유 바코드 생성 (인덱스와 랜덤 값을 추가하여 중복 방지)
        // 타임스탬프(13자리) + 체크섬(1자리) = 14자리 유지
        const baseTimestamp = Date.now();
        // 인덱스와 랜덤 값을 마지막 3자리에 추가 (0-999 범위)
        const offset = (inventoryIndex * 100 + Math.floor(Math.random() * 100)) % 1000;
        const uniqueTimestamp = baseTimestamp + offset;
        // 13자리로 제한 (타임스탬프가 13자리를 초과할 수 있으므로)
        const timestampStr = String(uniqueTimestamp).slice(-13);
        const checksum = timestampStr
          .split('')
          .reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10;
        const barcode = `${timestampStr}${checksum}`;
        inventoryIndex++;

        inventoryData.push({
          item_id: item.id,
          factory_id: item.factory_id || factories[Math.floor(Math.random() * factories.length)].id,
          storage_condition_id: item.storage_condition_id || storageConditions[Math.floor(Math.random() * storageConditions.length)].id,
          barcode: barcode,
          wholesale_price: item.wholesale_price,
          quantity: parseFloat(quantity),
          received_at: receivedAt,
          first_received_at: firstReceivedAt,
          expiration_date: expirationDate,
          status: determineStatus(parseFloat(quantity), item.shortage, expirationDate),
          unit: item.unit,
        });

        // 일부 품목은 여러 재고 항목 생성 (다양한 날짜, 수량)
        if (index % 3 === 0 && status === "Normal") {
          const secondExpirationDate = baseDate.add(120, "day").format("YYYY-MM-DD");
          const secondReceivedAt = baseDate.subtract(5, "day").toDate();
          const secondFirstReceivedAt = baseDate.subtract(8, "day").toDate();
          const secondQuantity = (item.shortage * (2 + Math.random() * 3)).toFixed(2);
          
          // 고유 바코드 생성 (인덱스와 랜덤 값을 추가하여 중복 방지)
          // 타임스탬프(13자리) + 체크섬(1자리) = 14자리 유지
          const secondBaseTimestamp = Date.now();
          // 인덱스와 랜덤 값을 마지막 3자리에 추가 (0-999 범위)
          const secondOffset = (inventoryIndex * 100 + Math.floor(Math.random() * 100)) % 1000;
          const secondUniqueTimestamp = secondBaseTimestamp + secondOffset;
          // 13자리로 제한 (타임스탬프가 13자리를 초과할 수 있으므로)
          const secondTimestampStr = String(secondUniqueTimestamp).slice(-13);
          const secondChecksum = secondTimestampStr
            .split('')
            .reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10;
          const secondBarcode = `${secondTimestampStr}${secondChecksum}`;
          inventoryIndex++;

          inventoryData.push({
            item_id: item.id,
            factory_id: item.factory_id || factories[Math.floor(Math.random() * factories.length)].id,
            storage_condition_id: item.storage_condition_id || storageConditions[Math.floor(Math.random() * storageConditions.length)].id,
            barcode: secondBarcode,
            wholesale_price: item.wholesale_price,
            quantity: parseFloat(secondQuantity),
            received_at: secondReceivedAt,
            first_received_at: secondFirstReceivedAt,
            expiration_date: secondExpirationDate,
            status: determineStatus(parseFloat(secondQuantity), item.shortage, secondExpirationDate),
            unit: item.unit,
          });
        }
      });

      const createdInventories = await Inventories.bulkCreate(inventoryData, { transaction: t });
      console.log(`✓ ${createdInventories.length}건 재고 추가 완료\n`);

      await t.commit();

      // 결과 출력
      console.log("\n========================================");
      console.log("🎉 강아지 간식/사료 데이터 시딩 완료!");
      console.log("========================================\n");

      console.log("📊 추가된 데이터:");
      console.log(`   ✓ 품목: ${createdItems.length}개`);
      console.log(`   ✓ BOM: ${createdBOMs.length}개`);
      console.log(`   ✓ 재고: ${createdInventories.length}건\n`);

      console.log("📦 품목 카테고리:");
      const rawMaterials = createdItems.filter(i => i.category === "RawMaterial").length;
      const semiFinished = createdItems.filter(i => i.category === "SemiFinished").length;
      const finished = createdItems.filter(i => i.category === "Finished").length;
      const supplies = createdItems.filter(i => i.category === "Supply").length;
      console.log(`   - 원재료: ${rawMaterials}개`);
      console.log(`   - 반제품: ${semiFinished}개`);
      console.log(`   - 완제품: ${finished}개`);
      console.log(`   - 소모품: ${supplies}개\n`);

      console.log("📊 재고 상태:");
      const normalCount = createdInventories.filter(i => i.status === "Normal").length;
      const lowStockCount = createdInventories.filter(i => i.status === "LowStock").length;
      const expiringCount = createdInventories.filter(i => i.status === "Expiring").length;
      const expiredCount = createdInventories.filter(i => i.status === "Expired").length;
      console.log(`   - 정상: ${normalCount}건`);
      console.log(`   - 부족: ${lowStockCount}건`);
      console.log(`   - 유통기한임박: ${expiringCount}건`);
      console.log(`   - 유통기한만료: ${expiredCount}건\n`);

      console.log("💡 다음 단계:");
      console.log("   1. 재고 조회: GET /api/inventories");
      console.log("   2. 품목 조회: GET /api/items");
      console.log("   3. BOM 조회: GET /api/boms");
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
seedDogFoodItems();

