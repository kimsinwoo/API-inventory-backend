/**
 * 바코드 기반 물류 작업 서비스
 * - 바코드 스캔으로 재고 조회, 출고, 이동, 배송 처리
 */

const db = require("../../models");
const { Inventories, Items, Factory, InventoryMovement, StorageCondition, sequelize } = db;
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const { generateBarcode, parseBarcode, validateBarcode } = require("../utils/barcodeGenerator");

/* ===============================
 * 🔹 바코드 생성 (라벨 프린트용)
 * =============================== */
exports.generateBarcodeForLabel = async (payload) => {
  const { itemId, quantity, receivedAt } = payload;

  // 품목 조회
  const item = await Items.findByPk(itemId);
  if (!item) {
    throw new Error(`품목(ID: ${itemId})을 찾을 수 없습니다`);
  }

  // 바코드 생성
  const barcode = generateBarcode();
  const barcodeInfo = parseBarcode(barcode);

  return {
    barcode,
    item: {
      id: item.id,
      code: item.code,
      name: item.name,
      unit: item.unit,
    },
    quantity: Number(quantity),
    receivedAt: receivedAt || new Date(),
    barcodeInfo: {
      timestamp: barcodeInfo.timestamp,
      createdAt: barcodeInfo.createdAt,
      checksum: barcodeInfo.checksum,
    },
    labelPrintReady: true,
  };
};

/* ===============================
 * 🔹 최초 입고 (바코드 포함)
 * =============================== */
exports.receiveWithBarcode = async (payload, userId) => {
  const {
    barcode,
    itemId,
    factoryId,
    storageConditionId,
    wholesalePrice,
    quantity,
    receivedAt,
    unit,
    note,
  } = payload;

  // 바코드 유효성 검증
  if (!validateBarcode(barcode)) {
    throw new Error("유효하지 않은 바코드 형식입니다 (14자리 숫자)");
  }

  // 중복 바코드 확인
  const existingInventory = await Inventories.findOne({ where: { barcode } });
  if (existingInventory) {
    throw new Error(`바코드 ${barcode}는 이미 사용 중입니다`);
  }

  // 품목 조회
  const item = await Items.findByPk(itemId);
  if (!item) {
    throw new Error(`품목(ID: ${itemId})을 찾을 수 없습니다`);
  }

  // 공장 조회
  const factory = await Factory.findByPk(factoryId);
  if (!factory) {
    throw new Error(`공장(ID: ${factoryId})을 찾을 수 없습니다`);
  }

  // 보관 조건 조회
  const storageCondition = await StorageCondition.findByPk(storageConditionId);
  if (!storageCondition) {
    throw new Error(`보관 조건(ID: ${storageConditionId})을 찾을 수 없습니다`);
  }

  // 사용자 정보 조회
  let actorName = "시스템";
  if (userId) {
    const user = await db.User.findByPk(userId, {
      include: [{ model: db.UserProfile, as: "UserProfile", attributes: ["full_name"] }],
    });
    if (user && user.UserProfile) {
      actorName = user.UserProfile.full_name;
    }
  }

  // 유통기한 자동 계산
  const baseDate = receivedAt || new Date();
  const calculatedExpirationDate = dayjs(baseDate)
    .add(item.expiration_date || 365, "day")
    .format("YYYY-MM-DD");

  return sequelize.transaction(async (t) => {
    // 재고 생성
    const inventory = await Inventories.create(
      {
        item_id: itemId,
        factory_id: factoryId,
        storage_condition_id: storageConditionId,
        barcode,
        wholesale_price: Number(wholesalePrice),
        quantity: Number(quantity),
        received_at: baseDate,
        first_received_at: baseDate,
        expiration_date: calculatedExpirationDate,
        status: "Normal",
        unit: unit || item.unit,
      },
      { transaction: t }
    );

    // 이동 이력 생성
    await InventoryMovement.create(
      {
        type: "RECEIVE",
        item_id: itemId,
        barcode,
        quantity: Number(quantity),
        unit: unit || item.unit,
        to_factory_id: factoryId,
        note: note || "최초 입고",
        actor_name: actorName,
        occurred_at: baseDate,
      },
      { transaction: t }
    );

    return {
      message: "입고가 완료되었습니다",
      inventory: {
        id: inventory.id,
        barcode: inventory.barcode,
        itemName: item.name,
        quantity: Number(inventory.quantity),
        unit: inventory.unit,
        factoryName: factory.name,
        receivedAt: inventory.received_at,
        expirationDate: inventory.expiration_date,
      },
    };
  });
};

/* ===============================
 * 🔹 바코드 조회 (재고 정보 확인)
 * =============================== */
exports.getInventoryByBarcode = async (barcode) => {
  // 바코드 유효성 검증
  if (!validateBarcode(barcode)) {
    throw new Error("유효하지 않은 바코드 형식입니다 (14자리 숫자)");
  }

  // 바코드로 재고 조회
  const inventory = await Inventories.findOne({
    where: { barcode },
    include: [
      {
        model: Items,
        attributes: ["id", "code", "name", "category", "unit", "expiration_date"],
      },
      {
        model: Factory,
        attributes: ["id", "name", "type", "address"],
      },
      {
        model: StorageCondition,
        attributes: ["id", "name", "temperature_range", "humidity_range"],
      },
    ],
  });

  if (!inventory) {
    throw new Error(`바코드 ${barcode}에 해당하는 재고를 찾을 수 없습니다`);
  }

  // 바코드 파싱 정보
  const barcodeInfo = parseBarcode(barcode);

  return {
    inventory: {
      id: inventory.id,
      barcode: inventory.barcode,
      quantity: Number(inventory.quantity),
      unit: inventory.unit,
      wholesalePrice: Number(inventory.wholesale_price),
      receivedAt: inventory.received_at,
      firstReceivedAt: inventory.first_received_at,
      expirationDate: inventory.expiration_date,
      status: inventory.status,
      createdAt: inventory.createdAt,
    },
    item: inventory.Item
      ? {
          id: inventory.Item.id,
          code: inventory.Item.code,
          name: inventory.Item.name,
          category: inventory.Item.category,
          unit: inventory.Item.unit,
        }
      : null,
    factory: inventory.Factory
      ? {
          id: inventory.Factory.id,
          name: inventory.Factory.name,
          type: inventory.Factory.type,
          address: inventory.Factory.address,
        }
      : null,
    storageCondition: inventory.StorageCondition
      ? {
          id: inventory.StorageCondition.id,
          name: inventory.StorageCondition.name,
          temperatureRange: inventory.StorageCondition.temperature_range,
          humidityRange: inventory.StorageCondition.humidity_range,
        }
      : null,
    barcodeInfo: {
      timestamp: barcodeInfo.timestamp,
      createdAt: barcodeInfo.createdAt,
      checksum: barcodeInfo.checksum,
    },
  };
};

/* ===============================
 * 🔹 공장 이동 - 출고 (바코드 스캔)
 * =============================== */
exports.transferOut = async (payload, userId) => {
  const { barcode, quantity, toFactoryId, note } = payload;

  // 바코드 유효성 검증
  if (!validateBarcode(barcode)) {
    throw new Error("유효하지 않은 바코드 형식입니다");
  }

  // 바코드로 재고 조회
  const inventory = await Inventories.findOne({
    where: { barcode },
    include: [{ model: Items }, { model: Factory }],
  });

  if (!inventory) {
    throw new Error(`바코드 ${barcode}에 해당하는 재고를 찾을 수 없습니다`);
  }

  const availableQty = Number(inventory.quantity);
  const transferQty = Number(quantity);

  if (transferQty > availableQty) {
    throw new Error(
      `이동 수량 ${transferQty}${inventory.unit}이(가) 재고 ${availableQty}${inventory.unit}보다 많습니다`
    );
  }

  if (inventory.factory_id === toFactoryId) {
    throw new Error("동일한 공장으로는 이동할 수 없습니다");
  }

  // 목적지 공장 확인
  const toFactory = await Factory.findByPk(toFactoryId);
  if (!toFactory) {
    throw new Error(`목적지 공장(ID: ${toFactoryId})을 찾을 수 없습니다`);
  }

  // 사용자 정보 조회
  let actorName = "시스템";
  if (userId) {
    const user = await db.User.findByPk(userId, {
      include: [{ model: db.UserProfile, as: "UserProfile", attributes: ["full_name"] }],
    });
    if (user && user.UserProfile) {
      actorName = user.UserProfile.full_name;
    }
  }

  return sequelize.transaction(async (t) => {
    // 출발지 재고 차감
    await inventory.update(
      { quantity: availableQty - transferQty },
      { transaction: t }
    );

    // TRANSFER_OUT 이력 (이동 중 상태)
    await InventoryMovement.create(
      {
        type: "TRANSFER_OUT",
        item_id: inventory.item_id,
        barcode: inventory.barcode,
        quantity: transferQty,
        unit: inventory.unit,
        from_factory_id: inventory.factory_id,
        to_factory_id: toFactoryId,
        note: note || `${inventory.Factory.name} → ${toFactory.name} (이동 중)`,
        actor_name: actorName,
        occurred_at: new Date(),
      },
      { transaction: t }
    );

    return {
      message: `바코드 ${barcode} 이동 출고 완료 (이동 중 상태)`,
      transferOut: {
        barcode: inventory.barcode,
        itemName: inventory.Item ? inventory.Item.name : "알 수 없음",
        quantity: transferQty,
        unit: inventory.unit,
        fromFactory: {
          id: inventory.factory_id,
          name: inventory.Factory.name,
          remainingQuantity: availableQty - transferQty,
        },
        toFactory: {
          id: toFactoryId,
          name: toFactory.name,
        },
        status: "이동 중",
        actorName,
        transferredAt: new Date(),
      },
    };
  });
};

/* ===============================
 * 🔹 공장 이동 - 입고 (바코드 입력)
 * =============================== */
exports.transferIn = async (payload, userId) => {
  const {
    barcode,
    factoryId,
    storageConditionId,
    note,
  } = payload;

  // 바코드 유효성 검증
  if (!validateBarcode(barcode)) {
    throw new Error("유효하지 않은 바코드 형식입니다");
  }

  // 바코드로 마지막 TRANSFER_OUT 이력 조회
  const lastTransferOut = await InventoryMovement.findOne({
    where: {
      barcode,
      type: "TRANSFER_OUT",
      to_factory_id: factoryId,
    },
    include: [{ model: Items }],
    order: [["occurred_at", "DESC"]],
  });

  if (!lastTransferOut) {
    throw new Error(
      `바코드 ${barcode}의 이 공장으로의 이동 출고 기록을 찾을 수 없습니다`
    );
  }

  // 이미 입고 완료되었는지 확인
  const existingTransferIn = await InventoryMovement.findOne({
    where: {
      barcode,
      type: "TRANSFER_IN",
      to_factory_id: factoryId,
      occurred_at: { [Op.gte]: lastTransferOut.occurred_at },
    },
  });

  if (existingTransferIn) {
    throw new Error("이 바코드는 이미 입고 처리되었습니다");
  }

  // 공장 조회
  const factory = await Factory.findByPk(factoryId);
  if (!factory) {
    throw new Error(`공장(ID: ${factoryId})을 찾을 수 없습니다`);
  }

  // 사용자 정보 조회
  let actorName = "시스템";
  if (userId) {
    const user = await db.User.findByPk(userId, {
      include: [{ model: db.UserProfile, as: "UserProfile", attributes: ["full_name"] }],
    });
    if (user && user.UserProfile) {
      actorName = user.UserProfile.full_name;
    }
  }

  // 원본 재고 정보 조회 (first_received_at, expiration_date 유지를 위해)
  const originalInventory = await Inventories.findOne({
    where: { barcode },
    order: [["created_at", "ASC"]],
  });

  return sequelize.transaction(async (t) => {
    // 목적지 재고 생성 (바코드 유지)
    const newInventory = await Inventories.create(
      {
        item_id: lastTransferOut.item_id,
        factory_id: factoryId,
        storage_condition_id: storageConditionId || lastTransferOut.Item.storage_condition_id,
        barcode: lastTransferOut.barcode, // 바코드 유지 ✅
        wholesale_price: originalInventory ? originalInventory.wholesale_price : 0,
        quantity: lastTransferOut.quantity,
        received_at: new Date(),
        first_received_at: originalInventory
          ? originalInventory.first_received_at
          : new Date(), // 최초 입고 날짜 유지
        expiration_date: originalInventory
          ? originalInventory.expiration_date
          : dayjs().add(365, "day").format("YYYY-MM-DD"),
        status: "Normal",
        unit: lastTransferOut.unit,
      },
      { transaction: t }
    );

    // TRANSFER_IN 이력
    await InventoryMovement.create(
      {
        type: "TRANSFER_IN",
        item_id: lastTransferOut.item_id,
        barcode: lastTransferOut.barcode,
        quantity: lastTransferOut.quantity,
        unit: lastTransferOut.unit,
        from_factory_id: lastTransferOut.from_factory_id,
        to_factory_id: factoryId,
        note: note || `이동 입고 완료`,
        actor_name: actorName,
        occurred_at: new Date(),
      },
      { transaction: t }
    );

    return {
      message: `바코드 ${barcode} 이동 입고 완료`,
      transferIn: {
        barcode: newInventory.barcode,
        itemName: lastTransferOut.Item ? lastTransferOut.Item.name : "알 수 없음",
        quantity: Number(newInventory.quantity),
        unit: newInventory.unit,
        factory: {
          id: factoryId,
          name: factory.name,
        },
        actorName,
        receivedAt: newInventory.received_at,
      },
    };
  });
};

/* ===============================
 * 🔹 바코드 기반 출고
 * =============================== */
exports.issueByBarcode = async (payload, userId) => {
  const {
    barcode,
    quantity,
    issueType = "SHIPPING",
    note,
    customerName,
    trackingNumber,
  } = payload;

  // 바코드 유효성 검증
  if (!validateBarcode(barcode)) {
    throw new Error("유효하지 않은 바코드 형식입니다");
  }

  // 바코드로 재고 조회
  const inventory = await Inventories.findOne({
    where: { barcode },
    include: [{ model: Items }],
  });

  if (!inventory) {
    throw new Error(`바코드 ${barcode}에 해당하는 재고를 찾을 수 없습니다`);
  }

  const availableQty = Number(inventory.quantity);
  const issueQty = Number(quantity);

  if (issueQty > availableQty) {
    throw new Error(
      `출고 수량 ${issueQty}${inventory.unit}이(가) 재고 ${availableQty}${inventory.unit}보다 많습니다`
    );
  }

  // 사용자 정보 조회
  let actorName = "시스템";
  if (userId) {
    const user = await db.User.findByPk(userId, {
      include: [{ model: db.UserProfile, as: "UserProfile", attributes: ["full_name"] }],
    });
    if (user && user.UserProfile) {
      actorName = user.UserProfile.full_name;
    }
  }

  return sequelize.transaction(async (t) => {
    // 재고 차감
    await inventory.update(
      { quantity: availableQty - issueQty },
      { transaction: t }
    );

    // 이동 이력 생성
    const movement = await InventoryMovement.create(
      {
        type: "ISSUE",
        item_id: inventory.item_id,
        barcode: inventory.barcode,
        quantity: issueQty,
        unit: inventory.unit,
        from_factory_id: inventory.factory_id,
        to_factory_id: null,
        note: note || `${issueType} 출고${customerName ? ` (고객: ${customerName})` : ""}${trackingNumber ? ` (송장: ${trackingNumber})` : ""}`,
        actor_name: actorName,
        occurred_at: new Date(),
      },
      { transaction: t }
    );

    return {
      message: `바코드 ${barcode} 출고 완료`,
      issued: {
        barcode: inventory.barcode,
        itemName: inventory.Item ? inventory.Item.name : "알 수 없음",
        quantity: issueQty,
        unit: inventory.unit,
        remainingQuantity: availableQty - issueQty,
        actorName,
        issuedAt: movement.occurred_at,
        issueType,
        customerName: customerName || null,
        trackingNumber: trackingNumber || null,
      },
    };
  });
};

/* ===============================
 * 🔹 바코드 배송 준비/완료 처리
 * =============================== */
exports.shipByBarcode = async (payload, userId) => {
  const {
    barcode,
    quantity,
    customerName,
    customerAddress,
    customerPhone,
    shippingCompany,
    trackingNumber,
    shippingMessage,
  } = payload;

  // 바코드 유효성 검증
  if (!validateBarcode(barcode)) {
    throw new Error("유효하지 않은 바코드 형식입니다");
  }

  // 바코드로 재고 조회
  const inventory = await Inventories.findOne({
    where: { barcode },
    include: [{ model: Items }],
  });

  if (!inventory) {
    throw new Error(`바코드 ${barcode}에 해당하는 재고를 찾을 수 없습니다`);
  }

  const availableQty = Number(inventory.quantity);
  const shipQty = Number(quantity);

  if (shipQty > availableQty) {
    throw new Error(
      `배송 수량 ${shipQty}${inventory.unit}이(가) 재고 ${availableQty}${inventory.unit}보다 많습니다`
    );
  }

  // 사용자 정보 조회
  let actorName = "시스템";
  if (userId) {
    const user = await db.User.findByPk(userId, {
      include: [{ model: db.UserProfile, as: "UserProfile", attributes: ["full_name"] }],
    });
    if (user && user.UserProfile) {
      actorName = user.UserProfile.full_name;
    }
  }

  return sequelize.transaction(async (t) => {
    // 재고 차감
    await inventory.update(
      { quantity: availableQty - shipQty },
      { transaction: t }
    );

    // 배송 정보 문자열 생성
    const shippingInfo = [
      `고객: ${customerName}`,
      customerPhone ? `연락처: ${customerPhone}` : null,
      customerAddress ? `주소: ${customerAddress}` : null,
      shippingCompany ? `택배사: ${shippingCompany}` : null,
      trackingNumber ? `송장: ${trackingNumber}` : null,
      shippingMessage ? `배송메시지: ${shippingMessage}` : null,
    ].filter(Boolean).join(" | ");

    // 이동 이력 생성
    const movement = await InventoryMovement.create(
      {
        type: "ISSUE",
        item_id: inventory.item_id,
        barcode: inventory.barcode,
        quantity: shipQty,
        unit: inventory.unit,
        from_factory_id: inventory.factory_id,
        to_factory_id: null,
        note: `배송 출고 - ${shippingInfo}`,
        actor_name: actorName,
        occurred_at: new Date(),
      },
      { transaction: t }
    );

    return {
      message: `바코드 ${barcode} 배송 처리 완료`,
      shipping: {
        barcode: inventory.barcode,
        itemName: inventory.Item ? inventory.Item.name : "알 수 없음",
        quantity: shipQty,
        unit: inventory.unit,
        remainingQuantity: availableQty - shipQty,
        customer: {
          name: customerName,
          phone: customerPhone || null,
          address: customerAddress || null,
        },
        shipping: {
          company: shippingCompany || null,
          trackingNumber: trackingNumber || null,
          message: shippingMessage || null,
        },
        actorName,
        shippedAt: movement.occurred_at,
      },
    };
  });
};

/* ===============================
 * 🔹 바코드 이력 조회
 * =============================== */
exports.getBarcodeHistory = async (barcode) => {
  // 바코드 유효성 검증
  if (!validateBarcode(barcode)) {
    throw new Error("유효하지 않은 바코드 형식입니다");
  }

  // 바코드로 재고 조회 (최신 것)
  const inventory = await Inventories.findOne({
    where: { barcode },
    include: [{ model: Items, attributes: ["id", "code", "name"] }],
    order: [["created_at", "DESC"]],
  });

  if (!inventory) {
    // 재고는 없지만 이력은 있을 수 있음 (모두 출고된 경우)
    const hasHistory = await InventoryMovement.count({ where: { barcode } });
    if (!hasHistory) {
      throw new Error(`바코드 ${barcode}에 해당하는 데이터를 찾을 수 없습니다`);
    }
  }

  // 이동 이력 조회
  const movements = await InventoryMovement.findAll({
    where: { barcode },
    include: [
      { model: Items, attributes: ["id", "code", "name"] },
      { model: Factory, as: "fromFactory", attributes: ["id", "name"], required: false },
      { model: Factory, as: "toFactory", attributes: ["id", "name"], required: false },
    ],
    order: [["occurred_at", "DESC"]],
  });

  const typeMap = {
    RECEIVE: "입고",
    ISSUE: "출고",
    TRANSFER_OUT: "이동출고",
    TRANSFER_IN: "이동입고",
  };

  return {
    barcode,
    item: inventory && inventory.Item
      ? {
          id: inventory.Item.id,
          code: inventory.Item.code,
          name: inventory.Item.name,
        }
      : movements[0] && movements[0].Item
      ? {
          id: movements[0].Item.id,
          code: movements[0].Item.code,
          name: movements[0].Item.name,
        }
      : null,
    currentQuantity: inventory ? Number(inventory.quantity) : 0,
    unit: inventory ? inventory.unit : (movements[0] ? movements[0].unit : "EA"),
    status: inventory ? inventory.status : "완료",
    history: movements.map(m => ({
      id: m.id,
      type: typeMap[m.type] || m.type,
      typeRaw: m.type,
      quantity: Number(m.quantity),
      unit: m.unit,
      fromFactory: m.fromFactory
        ? { id: m.fromFactory.id, name: m.fromFactory.name }
        : null,
      toFactory: m.toFactory
        ? { id: m.toFactory.id, name: m.toFactory.name }
        : null,
      note: m.note || "",
      actorName: m.actor_name || "시스템",
      occurredAt: m.occurred_at,
      createdAt: m.createdAt,
    })),
  };
};
