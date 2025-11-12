/**
 * 재고 추가 스크립트
 * 사용법: node scripts/add-inventory.js "품목명" 수량
 * 예: node scripts/add-inventory.js "오리고기 저키 (100g)" 400
 */

const db = require('../models');
const { Items, Factory, StorageCondition, Inventories, InventoryMovement, sequelize } = db;
const { Op } = require('sequelize');
const dayjs = require('dayjs');

async function findItemByNameOrCode(searchTerm) {
  // 코드로 먼저 검색
  let item = await Items.findOne({
    where: {
      code: searchTerm
    },
    include: [{ model: Factory }]
  });
  
  // 코드로 못 찾으면 이름으로 검색
  if (!item) {
    item = await Items.findOne({
      where: {
        name: {
          [Op.like]: `%${searchTerm}%`
        }
      },
      include: [{ model: Factory }]
    });
  }
  
  return item;
}

async function addInventory() {
  try {
    const searchTerm = process.argv[2] || 'FIN005'; // 기본값을 코드로 변경
    const quantity = parseFloat(process.argv[3]) || 400;
    
    console.log(`품목 검색: "${searchTerm}"`);
    console.log(`추가 수량: ${quantity}`);
    
    // 품목 찾기
    const item = await findItemByNameOrCode(searchTerm);
    
    if (!item) {
      console.error('❌ 품목을 찾을 수 없습니다:', searchTerm);
      console.log('\n전체 품목 목록:');
      const allItems = await Items.findAll({
        attributes: ['id', 'code', 'name', 'unit'],
        limit: 50,
        order: [['code', 'ASC']]
      });
      allItems.forEach(i => {
        console.log(`  - [${i.code}] ${i.name} (${i.unit})`);
      });
      process.exit(1);
    }
    
    console.log(`✅ 품목 찾음: [${item.code}] ${item.name} (ID: ${item.id}, 단위: ${item.unit})`);
    
    // 공장 확인
    let factoryId = item.factory_id;
    if (!factoryId) {
      // 기본 공장 찾기
      const defaultFactory = await Factory.findOne({
        order: [['id', 'ASC']]
      });
      if (!defaultFactory) {
        throw new Error('공장이 없습니다. 먼저 공장을 생성해주세요.');
      }
      factoryId = defaultFactory.id;
      console.log(`⚠️  품목에 공장이 없어 기본 공장 사용: ${defaultFactory.name} (ID: ${factoryId})`);
    } else {
      console.log(`✅ 공장: ${item.Factory ? item.Factory.name : `ID: ${factoryId}`}`);
    }
    
    // 보관 조건 확인
    let storageConditionId = item.storage_condition_id;
    if (!storageConditionId) {
      // 기본 보관 조건 찾기
      const defaultStorageCondition = await StorageCondition.findOne({
        order: [['id', 'ASC']]
      });
      if (!defaultStorageCondition) {
        throw new Error('보관 조건이 없습니다. 먼저 보관 조건을 생성해주세요.');
      }
      storageConditionId = defaultStorageCondition.id;
      console.log(`⚠️  품목에 보관 조건이 없어 기본 보관 조건 사용: ${defaultStorageCondition.name} (ID: ${storageConditionId})`);
    } else {
      const storageCondition = await StorageCondition.findByPk(storageConditionId);
      console.log(`✅ 보관 조건: ${storageCondition ? storageCondition.name : `ID: ${storageConditionId}`}`);
    }
    
    // 도매가 (품목의 도매가 또는 기본값)
    const wholesalePrice = item.wholesale_price || 0;
    console.log(`✅ 도매가: ${wholesalePrice}원`);
    
    // 입고 처리
    const now = new Date();
    const receivedAt = now;
    const firstReceivedAt = now;
    
    // 유통기한 계산
    const expirationDate = dayjs(now)
      .add(item.expiration_date || 365, 'day')
      .format('YYYY-MM-DD');
    
    console.log(`\n재고 추가 중...`);
    console.log(`  - 수량: ${quantity} ${item.unit}`);
    console.log(`  - 입고일: ${dayjs(now).format('YYYY-MM-DD')}`);
    console.log(`  - 유통기한: ${expirationDate}`);
    
    // 바코드 생성 (간단한 방식)
    const barcode = `${item.id.toString().padStart(3, '0')}${dayjs(now).format('YYMMDDHHmmss')}`.substring(0, 14);
    
    const result = await sequelize.transaction(async (t) => {
      // 재고 생성
      const inventory = await Inventories.create({
        item_id: item.id,
        factory_id: factoryId,
        storage_condition_id: storageConditionId,
        barcode: barcode,
        wholesale_price: wholesalePrice,
        quantity: quantity,
        received_at: receivedAt,
        first_received_at: firstReceivedAt,
        expiration_date: expirationDate,
        status: 'Normal',
        unit: item.unit,
      }, { transaction: t });
      
      // 이동 이력 생성
      await InventoryMovement.create({
        type: 'RECEIVE',
        item_id: item.id,
        barcode: barcode,
        quantity: quantity,
        unit: item.unit,
        from_factory_id: null,
        to_factory_id: factoryId,
        note: `스크립트로 재고 추가: ${item.name}`,
        actor_name: '시스템',
        occurred_at: receivedAt,
      }, { transaction: t });
      
      return inventory;
    });
    
    console.log(`\n✅ 재고 추가 완료!`);
    console.log(`  - 재고 ID: ${result.id}`);
    console.log(`  - 바코드: ${barcode}`);
    console.log(`  - 수량: ${quantity} ${item.unit}`);
    
    // 현재 총 재고 확인
    const totalInventory = await Inventories.sum('quantity', {
      where: {
        item_id: item.id,
        factory_id: factoryId
      }
    });
    
    console.log(`\n현재 총 재고: ${totalInventory || 0} ${item.unit}`);
    
    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    console.error(error.stack);
    await db.sequelize.close();
    process.exit(1);
  }
}

// 스크립트 실행
addInventory();

