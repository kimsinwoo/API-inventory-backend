/**
 * 강아지 간식 제조 회사 시드 데이터
 * 사용법: node seed-petsnack-data.js
 */
const db = require("./models");
const bcrypt = require("bcryptjs");

async function seedData() {
  try {
    console.log("🐕 강아지 간식 회사 데이터 생성 시작...\n");

    // 기존 데이터 삭제 (개발 환경에서만)
    await db.sequelize.sync({ force: true });
    console.log("✓ 기존 데이터 초기화 완료\n");

    /* ===============================
     * 1. 사용자 프로필 및 사용자 생성
     * =============================== */
    console.log("👤 사용자 데이터 생성 중...");

    const userProfiles = await db.UserProfile.bulkCreate([
      {
        full_name: "김철수",
        phone_number: "010-1234-5678",
        email: "ceo@dogsnack.com",
        hire_date: "2020-01-01",
        position: "대표이사",
        department: "경영",
        role: 4, // CEO
      },
      {
        full_name: "이영희",
        phone_number: "010-2345-6789",
        email: "manager@dogsnack.com",
        hire_date: "2020-03-01",
        position: "생산팀장",
        department: "생산",
        role: 2, // 팀장
      },
      {
        full_name: "박지민",
        phone_number: "010-3456-7890",
        email: "staff@dogsnack.com",
        hire_date: "2021-06-01",
        position: "생산담당",
        department: "생산",
        role: 1, // 직원
      },
      {
        full_name: "최민수",
        phone_number: "010-4567-8901",
        email: "warehouse@dogsnack.com",
        hire_date: "2021-09-01",
        position: "창고관리",
        department: "물류",
        role: 1,
      },
    ]);

    const hashedPassword = await bcrypt.hash("password123", 10);
    await db.User.bulkCreate([
      {
        id: "ceo@dogsnack.com",
        password: hashedPassword,
        profile_id: userProfiles[0].id,
      },
      {
        id: "manager@dogsnack.com",
        password: hashedPassword,
        profile_id: userProfiles[1].id,
      },
      {
        id: "staff@dogsnack.com",
        password: hashedPassword,
        profile_id: userProfiles[2].id,
      },
      {
        id: "warehouse@dogsnack.com",
        password: hashedPassword,
        profile_id: userProfiles[3].id,
      },
    ]);

    console.log("✓ 사용자 4명 생성 완료\n");

    /* ===============================
     * 2. 공정 생성
     * =============================== */
    console.log("🔧 공정 데이터 생성 중...");

    const processes = await db.Process.bulkCreate([
      { name: "원료 수급" },
      { name: "원료 세척" },
      { name: "원료 손질" },
      { name: "1차 건조" },
      { name: "커팅/성형" },
      { name: "2차 건조" },
      { name: "품질검사" },
      { name: "포장" },
      { name: "박스 포장" },
      { name: "출하" },
    ]);

    console.log("✓ 공정 10개 생성 완료\n");

    /* ===============================
     * 3. 공장 생성
     * =============================== */
    console.log("🏭 공장 데이터 생성 중...");

    const factories = await db.Factory.bulkCreate([
      {
        type: "1PreProcessing",
        name: "원료 전처리 센터",
        address: "경기도 이천시 부발읍 경충대로 2709번길 100",
      },
      {
        type: "2Manufacturing",
        name: "강아지 간식 제조 공장",
        address: "경기도 이천시 부발읍 경충대로 2800",
      },
      {
        type: "Warehouse",
        name: "완제품 물류창고",
        address: "경기도 이천시 부발읍 물류단지로 50",
      },
    ]);

    // 공장-공정 연결
    await factories[0].addProcesses([
      processes[0],
      processes[1],
      processes[2],
    ]); // 전처리: 수급, 세척, 손질
    await factories[1].addProcesses([
      processes[3],
      processes[4],
      processes[5],
      processes[6],
      processes[7],
      processes[8],
    ]); // 제조: 건조, 커팅, 검사, 포장
    await factories[2].addProcesses([processes[9]]); // 창고: 출하

    console.log("✓ 공장 3개 생성 완료\n");

    /* ===============================
     * 4. 보관 조건 생성
     * =============================== */
    console.log("🌡️ 보관 조건 생성 중...");

    const storageConditions = await db.StorageCondition.bulkCreate([
      {
        name: "냉동 보관",
        temperature_range: "-18°C ~ -20°C",
        humidity_range: "40-50%",
      },
      {
        name: "냉장 보관",
        temperature_range: "0°C ~ 4°C",
        humidity_range: "40-60%",
      },
      {
        name: "실온 보관",
        temperature_range: "15°C ~ 25°C",
        humidity_range: "30-50%",
      },
      {
        name: "건조 보관",
        temperature_range: "20°C ~ 25°C",
        humidity_range: "20-30%",
      },
    ]);

    console.log("✓ 보관 조건 4개 생성 완료\n");

    /* ===============================
     * 5. 품목 생성 (원재료, 반제품, 완제품)
     * =============================== */
    console.log("📦 품목 데이터 생성 중...");

    // 원재료
    const rawMaterials = await db.Items.bulkCreate([
      {
        code: "RAW001",
        name: "국내산 닭가슴살 (신선)",
        category: "RawMaterial",
        unit: "kg",
        factory_id: factories[0].id,
        storage_condition_id: storageConditions[1].id, // 냉장
        shortage: 50,
        expiration_date: 7,
        wholesale_price: 8000,
      },
      {
        code: "RAW002",
        name: "국내산 소고기 (냉동)",
        category: "RawMaterial",
        unit: "kg",
        factory_id: factories[0].id,
        storage_condition_id: storageConditions[0].id, // 냉동
        shortage: 30,
        expiration_date: 180,
        wholesale_price: 15000,
      },
      {
        code: "RAW003",
        name: "돼지 귀 (냉동)",
        category: "RawMaterial",
        unit: "kg",
        factory_id: factories[0].id,
        storage_condition_id: storageConditions[0].id,
        shortage: 20,
        expiration_date: 180,
        wholesale_price: 5000,
      },
      {
        code: "RAW004",
        name: "연어 (수입산)",
        category: "RawMaterial",
        unit: "kg",
        factory_id: factories[0].id,
        storage_condition_id: storageConditions[0].id,
        shortage: 25,
        expiration_date: 90,
        wholesale_price: 12000,
      },
      {
        code: "RAW005",
        name: "오리고기 (냉동)",
        category: "RawMaterial",
        unit: "kg",
        factory_id: factories[0].id,
        storage_condition_id: storageConditions[0].id,
        shortage: 20,
        expiration_date: 180,
        wholesale_price: 7000,
      },
      {
        code: "RAW006",
        name: "고구마 (국내산)",
        category: "RawMaterial",
        unit: "kg",
        factory_id: factories[0].id,
        storage_condition_id: storageConditions[2].id, // 실온
        shortage: 30,
        expiration_date: 30,
        wholesale_price: 2000,
      },
    ]);

    // 반제품
    const semiFinished = await db.Items.bulkCreate([
      {
        code: "SEMI001",
        name: "건조 닭가슴살 (반가공)",
        category: "SemiFinished",
        unit: "kg",
        factory_id: factories[1].id,
        storage_condition_id: storageConditions[3].id, // 건조
        shortage: 20,
        expiration_date: 60,
        wholesale_price: 25000,
      },
      {
        code: "SEMI002",
        name: "건조 소고기 (반가공)",
        category: "SemiFinished",
        unit: "kg",
        factory_id: factories[1].id,
        storage_condition_id: storageConditions[3].id,
        shortage: 15,
        expiration_date: 60,
        wholesale_price: 35000,
      },
      {
        code: "SEMI003",
        name: "건조 연어 (반가공)",
        category: "SemiFinished",
        unit: "kg",
        factory_id: factories[1].id,
        storage_condition_id: storageConditions[3].id,
        shortage: 15,
        expiration_date: 60,
        wholesale_price: 30000,
      },
    ]);

    // 완제품
    const finishedProducts = await db.Items.bulkCreate([
      {
        code: "FIN001",
        name: "프리미엄 닭가슴살 육포 (100g)",
        category: "Finished",
        unit: "EA",
        factory_id: factories[2].id,
        storage_condition_id: storageConditions[2].id, // 실온
        shortage: 100,
        expiration_date: 365,
        wholesale_price: 8000,
      },
      {
        code: "FIN002",
        name: "수제 소고기 육포 (100g)",
        category: "Finished",
        unit: "EA",
        factory_id: factories[2].id,
        storage_condition_id: storageConditions[2].id,
        shortage: 100,
        expiration_date: 365,
        wholesale_price: 12000,
      },
      {
        code: "FIN003",
        name: "연어 트릿 (50g)",
        category: "Finished",
        unit: "EA",
        factory_id: factories[2].id,
        storage_condition_id: storageConditions[2].id,
        shortage: 150,
        expiration_date: 365,
        wholesale_price: 6000,
      },
      {
        code: "FIN004",
        name: "돼지 귀 껌 (1개)",
        category: "Finished",
        unit: "EA",
        factory_id: factories[2].id,
        storage_condition_id: storageConditions[2].id,
        shortage: 200,
        expiration_date: 365,
        wholesale_price: 2000,
      },
      {
        code: "FIN005",
        name: "오리고기 저키 (100g)",
        category: "Finished",
        unit: "EA",
        factory_id: factories[2].id,
        storage_condition_id: storageConditions[2].id,
        shortage: 100,
        expiration_date: 365,
        wholesale_price: 9000,
      },
      {
        code: "FIN006",
        name: "고구마 큐브 간식 (200g)",
        category: "Finished",
        unit: "EA",
        factory_id: factories[2].id,
        storage_condition_id: storageConditions[2].id,
        shortage: 100,
        expiration_date: 180,
        wholesale_price: 5000,
      },
    ]);

    // 소모품
    const supplies = await db.Items.bulkCreate([
      {
        code: "SUP001",
        name: "포장지 (소)",
        category: "Supply",
        unit: "EA",
        factory_id: factories[1].id,
        storage_condition_id: storageConditions[2].id,
        shortage: 1000,
        expiration_date: 0,
        wholesale_price: 100,
      },
      {
        code: "SUP002",
        name: "포장지 (대)",
        category: "Supply",
        unit: "EA",
        factory_id: factories[1].id,
        storage_condition_id: storageConditions[2].id,
        shortage: 500,
        expiration_date: 0,
        wholesale_price: 150,
      },
      {
        code: "SUP003",
        name: "박스 (10개입)",
        category: "Supply",
        unit: "EA",
        factory_id: factories[2].id,
        storage_condition_id: storageConditions[2].id,
        shortage: 200,
        expiration_date: 0,
        wholesale_price: 500,
      },
    ]);

    console.log("✓ 품목 18개 생성 완료 (원재료 6개, 반제품 3개, 완제품 6개, 소모품 3개)\n");

    /* ===============================
     * 6. BOM (자재 명세서) 생성
     * =============================== */
    console.log("📋 BOM 데이터 생성 중...");

    const boms = await db.BOM.bulkCreate([
      {
        name: "프리미엄 닭가슴살 육포 BOM",
        description: "닭가슴살 육포 100g 생산 레시피",
      },
      {
        name: "수제 소고기 육포 BOM",
        description: "소고기 육포 100g 생산 레시피",
      },
      {
        name: "연어 트릿 BOM",
        description: "연어 트릿 50g 생산 레시피",
      },
    ]);

    // BOM 구성 요소
    await db.BOMComponent.bulkCreate([
      // 닭가슴살 육포
      {
        bom_id: boms[0].id,
        item_id: rawMaterials[0].id,
        quantity: 0.15,
        unit: "kg",
        sort_order: 1,
      },
      {
        bom_id: boms[0].id,
        item_id: supplies[0].id,
        quantity: 1,
        unit: "EA",
        sort_order: 2,
      },
      // 소고기 육포
      {
        bom_id: boms[1].id,
        item_id: rawMaterials[1].id,
        quantity: 0.15,
        unit: "kg",
        sort_order: 1,
      },
      {
        bom_id: boms[1].id,
        item_id: supplies[0].id,
        quantity: 1,
        unit: "EA",
        sort_order: 2,
      },
      // 연어 트릿
      {
        bom_id: boms[2].id,
        item_id: rawMaterials[3].id,
        quantity: 0.08,
        unit: "kg",
        sort_order: 1,
      },
      {
        bom_id: boms[2].id,
        item_id: supplies[0].id,
        quantity: 1,
        unit: "EA",
        sort_order: 2,
      },
    ]);

    console.log("✓ BOM 3개 생성 완료\n");

    /* ===============================
     * 7. 재고 생성
     * =============================== */
    console.log("📊 재고 데이터 생성 중...");

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    await db.Inventories.bulkCreate([
      // 원재료 재고
      {
        item_id: rawMaterials[0].id,
        factory_id: factories[0].id,
        storage_condition_id: storageConditions[1].id,
        lot_number: "LOT-20241029-001",
        wholesale_price: 8000,
        quantity: 120,
        unit: "kg",
        received_at: thirtyDaysAgo,
        first_received_at: thirtyDaysAgo,
        expiration_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: "Normal",
      },
      {
        item_id: rawMaterials[1].id,
        factory_id: factories[0].id,
        storage_condition_id: storageConditions[0].id,
        lot_number: "LOT-20241029-002",
        wholesale_price: 15000,
        quantity: 85,
        unit: "kg",
        received_at: thirtyDaysAgo,
        first_received_at: thirtyDaysAgo,
        expiration_date: new Date(
          today.getTime() + 180 * 24 * 60 * 60 * 1000
        ),
        status: "Normal",
      },
      {
        item_id: rawMaterials[2].id,
        factory_id: factories[0].id,
        storage_condition_id: storageConditions[0].id,
        lot_number: "LOT-20241029-003",
        wholesale_price: 5000,
        quantity: 65,
        unit: "kg",
        received_at: thirtyDaysAgo,
        first_received_at: thirtyDaysAgo,
        expiration_date: new Date(
          today.getTime() + 180 * 24 * 60 * 60 * 1000
        ),
        status: "Normal",
      },
      // 반제품 재고
      {
        item_id: semiFinished[0].id,
        factory_id: factories[1].id,
        storage_condition_id: storageConditions[3].id,
        lot_number: "LOT-20241029-101",
        wholesale_price: 25000,
        quantity: 45,
        unit: "kg",
        received_at: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        first_received_at: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        expiration_date: new Date(today.getTime() + 50 * 24 * 60 * 60 * 1000),
        status: "Normal",
      },
      // 완제품 재고
      {
        item_id: finishedProducts[0].id,
        factory_id: factories[2].id,
        storage_condition_id: storageConditions[2].id,
        lot_number: "LOT-20241029-201",
        wholesale_price: 8000,
        quantity: 580,
        unit: "EA",
        received_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        first_received_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        expiration_date: new Date(
          today.getTime() + 360 * 24 * 60 * 60 * 1000
        ),
        status: "Normal",
      },
      {
        item_id: finishedProducts[1].id,
        factory_id: factories[2].id,
        storage_condition_id: storageConditions[2].id,
        lot_number: "LOT-20241029-202",
        wholesale_price: 12000,
        quantity: 420,
        unit: "EA",
        received_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        first_received_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        expiration_date: new Date(
          today.getTime() + 360 * 24 * 60 * 60 * 1000
        ),
        status: "Normal",
      },
      {
        item_id: finishedProducts[2].id,
        factory_id: factories[2].id,
        storage_condition_id: storageConditions[2].id,
        lot_number: "LOT-20241029-203",
        wholesale_price: 6000,
        quantity: 35,
        unit: "EA",
        received_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        first_received_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        expiration_date: new Date(
          today.getTime() + 360 * 24 * 60 * 60 * 1000
        ),
        status: "LowStock",
      },
      // 소모품 재고
      {
        item_id: supplies[0].id,
        factory_id: factories[1].id,
        storage_condition_id: storageConditions[2].id,
        lot_number: "LOT-20241029-301",
        wholesale_price: 100,
        quantity: 5500,
        unit: "EA",
        received_at: thirtyDaysAgo,
        first_received_at: thirtyDaysAgo,
        expiration_date: new Date(
          today.getTime() + 3650 * 24 * 60 * 60 * 1000
        ),
        status: "Normal",
      },
    ]);

    console.log("✓ 재고 9개 생성 완료\n");

    /* ===============================
     * 8. 재고 이동 이력 생성
     * =============================== */
    console.log("🔄 재고 이동 이력 생성 중...");

    await db.InventoryMovement.bulkCreate([
      {
        type: "RECEIVE",
        item_id: rawMaterials[0].id,
        lot_number: "LOT-20241029-001",
        quantity: 120,
        unit: "kg",
        to_factory_id: factories[0].id,
        note: "원료 입고",
        actor_name: "박지민",
        occurred_at: thirtyDaysAgo,
      },
      {
        type: "ISSUE",
        item_id: rawMaterials[0].id,
        lot_number: "LOT-20241029-001",
        quantity: 30,
        unit: "kg",
        from_factory_id: factories[0].id,
        note: "생산 출고",
        actor_name: "이영희",
        occurred_at: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        type: "TRANSFER_OUT",
        item_id: semiFinished[0].id,
        lot_number: "LOT-20241029-101",
        quantity: 45,
        unit: "kg",
        from_factory_id: factories[1].id,
        to_factory_id: factories[2].id,
        note: "완제품 창고로 이동",
        actor_name: "최민수",
        occurred_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log("✓ 재고 이동 이력 3개 생성 완료\n");

    /* ===============================
     * 9. 주문 및 배송 배치 생성
     * =============================== */
    console.log("📦 주문 데이터 생성 중...");

    const shippingBatch = await db.ShippingBatch.create({
      batch_number: "SHIP-20241029-001",
      batch_name: "10월 쿠팡/네이버 주문",
      batch_date: today,
      total_orders: 8,
      b2c_count: 6,
      b2b_count: 2,
      status: "CONFIRMED",
      created_by: "이영희",
    });

    await db.Order.bulkCreate([
      // 쿠팡 주문
      {
        platform: "COUPANG",
        platform_order_number: "COUP-20241029-001",
        order_date: today,
        customer_name: "김멍멍",
        customer_phone: "010-1111-2222",
        recipient_name: "김멍멍",
        recipient_phone: "010-1111-2222",
        recipient_address: "서울특별시 강남구 테헤란로 123",
        recipient_zipcode: "06234",
        product_code: finishedProducts[0].code,
        product_name: finishedProducts[0].name,
        quantity: 3,
        unit_price: 8000,
        total_price: 24000,
        shipping_message: "부재시 문앞에 놓아주세요",
        order_status: "CONFIRMED",
        shipping_status: "READY",
        payment_status: "PAID",
        issue_type: "B2C",
        batch_id: shippingBatch.id,
      },
      {
        platform: "COUPANG",
        platform_order_number: "COUP-20241029-002",
        order_date: today,
        customer_name: "이왈왈",
        customer_phone: "010-2222-3333",
        recipient_name: "이왈왈",
        recipient_phone: "010-2222-3333",
        recipient_address: "서울특별시 서초구 서초대로 456",
        recipient_zipcode: "06590",
        product_code: finishedProducts[1].code,
        product_name: finishedProducts[1].name,
        quantity: 2,
        unit_price: 12000,
        total_price: 24000,
        order_status: "CONFIRMED",
        shipping_status: "READY",
        payment_status: "PAID",
        issue_type: "B2C",
        batch_id: shippingBatch.id,
      },
      // 네이버 주문
      {
        platform: "NAVER",
        platform_order_number: "NAV-20241029-001",
        order_date: today,
        customer_name: "박멍멍",
        customer_phone: "010-3333-4444",
        recipient_name: "박멍멍",
        recipient_phone: "010-3333-4444",
        recipient_address: "경기도 성남시 분당구 정자일로 789",
        recipient_zipcode: "13561",
        product_code: finishedProducts[2].code,
        product_name: finishedProducts[2].name,
        quantity: 5,
        unit_price: 6000,
        total_price: 30000,
        shipping_message: "경비실에 맡겨주세요",
        order_status: "CONFIRMED",
        shipping_status: "READY",
        payment_status: "PAID",
        issue_type: "B2C",
        batch_id: shippingBatch.id,
      },
      {
        platform: "NAVER",
        platform_order_number: "NAV-20241029-002",
        order_date: today,
        customer_name: "최왈왈",
        customer_phone: "010-4444-5555",
        recipient_name: "최왈왈",
        recipient_phone: "010-4444-5555",
        recipient_address: "인천광역시 연수구 송도과학로 321",
        recipient_zipcode: "21984",
        product_code: finishedProducts[3].code,
        product_name: finishedProducts[3].name,
        quantity: 10,
        unit_price: 2000,
        total_price: 20000,
        order_status: "CONFIRMED",
        shipping_status: "READY",
        payment_status: "PAID",
        issue_type: "B2C",
        batch_id: shippingBatch.id,
      },
      // 11번가 주문
      {
        platform: "11ST",
        platform_order_number: "11ST-20241029-001",
        order_date: today,
        customer_name: "정댕댕",
        customer_phone: "010-5555-6666",
        recipient_name: "정댕댕",
        recipient_phone: "010-5555-6666",
        recipient_address: "대전광역시 유성구 대학로 654",
        recipient_zipcode: "34141",
        product_code: finishedProducts[4].code,
        product_name: finishedProducts[4].name,
        quantity: 2,
        unit_price: 9000,
        total_price: 18000,
        order_status: "CONFIRMED",
        shipping_status: "READY",
        payment_status: "PAID",
        issue_type: "B2C",
        batch_id: shippingBatch.id,
      },
      {
        platform: "11ST",
        platform_order_number: "11ST-20241029-002",
        order_date: today,
        customer_name: "강멍멍",
        customer_phone: "010-6666-7777",
        recipient_name: "강멍멍",
        recipient_phone: "010-6666-7777",
        recipient_address: "부산광역시 해운대구 해운대해변로 987",
        recipient_zipcode: "48099",
        product_code: finishedProducts[5].code,
        product_name: finishedProducts[5].name,
        quantity: 4,
        unit_price: 5000,
        total_price: 20000,
        order_status: "CONFIRMED",
        shipping_status: "READY",
        payment_status: "PAID",
        issue_type: "B2C",
        batch_id: shippingBatch.id,
      },
      // B2B 대량 주문
      {
        platform: "MANUAL",
        platform_order_number: "B2B-20241029-001",
        order_date: today,
        customer_name: "댕댕샵 강남점",
        customer_phone: "02-1234-5678",
        recipient_name: "댕댕샵 강남점",
        recipient_phone: "02-1234-5678",
        recipient_address: "서울특별시 강남구 압구정로 111",
        recipient_zipcode: "06009",
        product_code: finishedProducts[0].code,
        product_name: finishedProducts[0].name,
        quantity: 50,
        unit_price: 7000,
        total_price: 350000,
        shipping_message: "영업시간 내 배송 필수",
        order_status: "CONFIRMED",
        shipping_status: "READY",
        payment_status: "PAID",
        issue_type: "B2B",
        batch_id: shippingBatch.id,
      },
      {
        platform: "MANUAL",
        platform_order_number: "B2B-20241029-002",
        order_date: today,
        customer_name: "펫마트 광교점",
        customer_phone: "031-8888-9999",
        recipient_name: "펫마트 광교점",
        recipient_phone: "031-8888-9999",
        recipient_address: "경기도 수원시 영통구 광교중앙로 222",
        recipient_zipcode: "16509",
        product_code: finishedProducts[1].code,
        product_name: finishedProducts[1].name,
        quantity: 30,
        unit_price: 11000,
        total_price: 330000,
        order_status: "CONFIRMED",
        shipping_status: "READY",
        payment_status: "PAID",
        issue_type: "B2B",
        batch_id: shippingBatch.id,
      },
    ]);

    console.log("✓ 주문 8개 생성 완료 (B2C 6개, B2B 2개)\n");

    /* ===============================
     * 완료
     * =============================== */
    console.log("========================================");
    console.log("✨ 모든 데이터 생성 완료!");
    console.log("========================================\n");

    console.log("📊 생성된 데이터 요약:");
    console.log("  - 사용자: 4명");
    console.log("  - 공정: 10개");
    console.log("  - 공장: 3개 (전처리, 제조, 창고)");
    console.log("  - 보관 조건: 4개");
    console.log("  - 품목: 18개");
    console.log("    * 원재료: 6개 (닭, 소, 돼지, 연어, 오리, 고구마)");
    console.log("    * 반제품: 3개");
    console.log("    * 완제품: 6개 (육포, 트릿, 껌, 저키, 큐브)");
    console.log("    * 소모품: 3개");
    console.log("  - BOM: 3개");
    console.log("  - 재고: 9개");
    console.log("  - 재고 이동: 3개");
    console.log("  - 주문: 8개 (B2C 6개, B2B 2개)");
    console.log("  - 배송 배치: 1개\n");

    console.log("🔐 로그인 정보:");
    console.log("  - CEO: ceo@dogsnack.com / password123");
    console.log("  - 팀장: manager@dogsnack.com / password123");
    console.log("  - 직원: staff@dogsnack.com / password123");
    console.log("  - 창고: warehouse@dogsnack.com / password123\n");
  } catch (error) {
    console.error("❌ 에러 발생:", error);
    throw error;
  }
}

// 실행
seedData()
  .then(() => {
    console.log("✓ 시드 데이터 생성 프로세스 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("✗ 시드 데이터 생성 실패:", error);
    process.exit(1);
  });

