/**
 * 입고/출고 트랜잭션 서비스
 * - 입고, 출고, 이동 처리 및 이력 관리
 * - 사용자 정보 연동
 */
const db = require("../../models");
const {
  Inventories,
  Items,
  Factory,
  InventoryMovement,
  User,
  UserProfile,
  sequelize,
} = db;
const { Op, fn, col } = require("sequelize");
const dayjs = require("dayjs");
const { generateBarcode } = require("../utils/barcodeGenerator");

/* ===============================
 * 🔹 FIFO 출고 로직 (개선)
 * =============================== */
async function fifoIssue({ itemId, factoryId, quantity, t }) {
  let remain = Number(quantity);
  if (remain <= 0) return { issued: 0, traces: [] };

  // 유통기한이 가까운 순서대로 출고 (FIFO + 유통기한 우선)
  const lots = await Inventories.findAll({
    where: {
      item_id: itemId,
      factory_id: factoryId,
      quantity: { [Op.gt]: 0 },
    },
    order: [
      ["expiration_date", "ASC"], // 유통기한 빠른 순
      ["received_at", "ASC"], // 입고일 빠른 순
      ["id", "ASC"],
    ],
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  if (lots.length === 0) {
    throw new Error("출고 가능한 재고가 없습니다");
  }

  const traces = [];
  let issued = 0;

  for (const lot of lots) {
    if (remain <= 0) break;
    const available = Number(lot.quantity);
    const take = Math.min(available, remain);

    if (take > 0) {
      await lot.update({ quantity: available - take }, { transaction: t });
      traces.push({
        barcode: lot.barcode,
        lotId: lot.id,
        take,
        expirationDate: lot.expiration_date,
      });
      issued += take;
      remain -= take;
    }
  }

  if (remain > 1e-9) {
    throw new Error(
      `재고가 부족합니다. 요청: ${quantity}, 가능: ${issued}`
    );
  }

  return { issued, traces };
}

/* ===============================
 * 🔹 입고 처리 (사용자 정보 포함)
 * =============================== */
exports.receiveTransaction = async (payload, userId) => {
  const {
    itemId,
    factoryId,
    storageConditionId,
    wholesalePrice,
    quantity,
    receivedAt,
    firstReceivedAt,
    unit,
    note,
    printLabel = false,
    labelSize = "large",
    labelQuantity = 1,
    barcode: existingBarcode, // 기존 바코드 (공장 이동 시 사용) ✅
  } = payload;

  // 사용자 정보 조회
  let actorName = "시스템";
  let userInfo = null;
  
  if (userId) {
    const user = await User.findByPk(userId, {
      include: [{ model: UserProfile, as: "UserProfile", attributes: ["full_name", "position"] }],
    });
    if (user && user.UserProfile) {
      actorName = user.UserProfile.full_name;
      userInfo = {
        userId: user.id,
        userName: user.UserProfile.full_name,
        position: user.UserProfile.position,
      };
    }
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
  const storageCondition = await db.StorageCondition.findByPk(
    storageConditionId
  );
  if (!storageCondition) {
    throw new Error(`보관 조건(ID: ${storageConditionId})을 찾을 수 없습니다`);
  }

  // 유통기한 자동 계산 (first_received_at 기준)
  const baseDate = firstReceivedAt ?? receivedAt;
  const calculatedExpirationDate = dayjs(baseDate)
    .add(item.expiration_date || 365, "day")
    .format("YYYY-MM-DD");

  // 바코드: 기존 바코드가 있으면 사용, 없으면 새로 생성 ✅
  const barcode = existingBarcode || generateBarcode(
    itemId,
    receivedAt,
    baseDate,
    calculatedExpirationDate
  );

  return sequelize.transaction(async (t) => {
    // 재고 생성
    const inv = await Inventories.create(
      {
        item_id: itemId,
        factory_id: factoryId,
        storage_condition_id: storageConditionId,
        barcode,
        wholesale_price: Number(wholesalePrice),
        quantity: Number(quantity),
        received_at: receivedAt,
        first_received_at: baseDate,
        expiration_date: calculatedExpirationDate,
        status: "Normal",
        unit: String(unit).trim(),
      },
      { transaction: t }
    );

    // 상태 업데이트
    const today = dayjs().startOf("day");
    const exp = dayjs(inv.expiration_date);
    let status = "Normal";
    if (exp.isBefore(today)) status = "Expired";
    else if (exp.diff(today, "day") <= 3) status = "Expiring";
    await inv.update({ status }, { transaction: t });

    // 이동 이력 생성
    await InventoryMovement.create(
      {
        type: "RECEIVE",
        item_id: itemId,
        barcode: inv.barcode,
        quantity: Number(quantity),
        unit,
        from_factory_id: null,
        to_factory_id: factoryId,
        note: note ?? null,
        actor_name: actorName,
        occurred_at: new Date(receivedAt),
      },
      { transaction: t }
    );

    // 라벨 생성 (옵션)
    let labelInfo = null;
    if (printLabel) {
      try {
        const labelService = require("./labelService");
        const dayjs = require("dayjs");
        
        const labelData = {
          labelSize,
          productName: item.name,
          manufactureDate: dayjs(baseDate).format("YYYY-MM-DD"),
          expiryDate: dayjs(calculatedExpirationDate).format("YYYY-MM-DD"),
          barcode: inv.barcode,
          quantity: Number(quantity),
          unit,
        };
        
        // 라벨 개수만큼 생성
        const labels = [];
        for (let i = 0; i < labelQuantity; i++) {
          const label = await labelService.generateLabel(labelData);
          labels.push(label);
        }
        
        labelInfo = {
          generated: true,
          labelSize,
          labelQuantity,
          labels,
          message: `${labelQuantity}개의 라벨이 생성되었습니다`,
        };
      } catch (error) {
        console.error("라벨 생성 실패:", error);
        labelInfo = {
          generated: false,
          error: "라벨 생성에 실패했습니다",
          message: error.message,
        };
      }
    } else {
      labelInfo = {
        generated: false,
        message: "라벨 프린트를 선택하지 않았습니다",
      };
    }

    return {
      inventory: inv,
      userInfo,
      label: labelInfo,
      message: `${actorName}님이 ${item.name}을(를) ${quantity}${unit} 입고 처리했습니다`,
    };
  });
};

/* ===============================
 * 🔹 출고 처리 (FIFO + 사용자 정보)
 * =============================== */
exports.issueTransaction = async (payload, userId) => {
  const {
    itemId,
    factoryId,
    quantity,
    unit,
    issueType = "OTHER",
    shippingInfo,
    note,
  } = payload;

  // 사용자 정보 조회
  let actorName = "시스템";
  let userInfo = null;
  
  if (userId) {
    const user = await User.findByPk(userId, {
      include: [{ model: UserProfile, as: "UserProfile", attributes: ["full_name", "position"] }],
    });
    if (user && user.UserProfile) {
      actorName = user.UserProfile.full_name;
      userInfo = {
        userId: user.id,
        userName: user.UserProfile.full_name,
        position: user.UserProfile.position,
      };
    }
  }

  // 품목 조회
  const item = await Items.findByPk(itemId);
  if (!item) {
    throw new Error(`품목(ID: ${itemId})을 찾을 수 없습니다`);
  }

  return sequelize.transaction(async (t) => {
    const { issued, traces } = await fifoIssue({
      itemId,
      factoryId,
      quantity,
      t,
    });

    // trace별 이력 생성
    const movements = [];
    for (const tr of traces) {
      const noteText = [];
      if (note) noteText.push(note);
      if (issueType) noteText.push(`유형: ${issueType}`);
      if (shippingInfo) {
        if (shippingInfo.recipientName)
          noteText.push(`수령인: ${shippingInfo.recipientName}`);
        if (shippingInfo.trackingNumber)
          noteText.push(`송장: ${shippingInfo.trackingNumber}`);
      }

      const movement = await InventoryMovement.create(
        {
          type: "ISSUE",
          item_id: itemId,
          barcode: tr.barcode,
          quantity: tr.take,
          unit,
          from_factory_id: factoryId,
          to_factory_id: null,
          note: noteText.join(" | ") || null,
          actor_name: actorName,
        },
        { transaction: t }
      );
      movements.push(movement);
    }

    return {
      issued,
      traces,
      movements,
      userInfo,
      shippingInfo,
      message: `${actorName}님이 ${item.name}을(를) ${issued}${unit} 출고 처리했습니다`,
    };
  });
};

/* ===============================
 * 🔹 공장 간 이동 처리
 * =============================== */
exports.transferTransaction = async (payload, userId) => {
  const {
    itemId,
    sourceFactoryId,
    destFactoryId,
    storageConditionId,
    quantity,
    unit,
    transferType = "OTHER",
    note,
  } = payload;

  if (sourceFactoryId === destFactoryId) {
    throw new Error("출발 공장과 도착 공장이 동일합니다");
  }

  // 사용자 정보 조회
  let actorName = "시스템";
  let userInfo = null;
  
  if (userId) {
    const user = await User.findByPk(userId, {
      include: [{ model: UserProfile, as: "UserProfile", attributes: ["full_name", "position"] }],
    });
    if (user && user.UserProfile) {
      actorName = user.UserProfile.full_name;
      userInfo = {
        userId: user.id,
        userName: user.UserProfile.full_name,
        position: user.UserProfile.position,
      };
    }
  }

  // 품목 조회
  const item = await Items.findByPk(itemId);
  if (!item) {
    throw new Error(`품목(ID: ${itemId})을 찾을 수 없습니다`);
  }

  return sequelize.transaction(async (t) => {
    const { issued, traces } = await fifoIssue({
      itemId,
      factoryId: sourceFactoryId,
      quantity,
      t,
    });

    const now = dayjs();

    // OUT 이력
    for (const tr of traces) {
      await InventoryMovement.create(
        {
          type: "TRANSFER_OUT",
          item_id: itemId,
          barcode: tr.barcode,
          quantity: tr.take,
          unit,
          from_factory_id: sourceFactoryId,
          to_factory_id: destFactoryId,
          note: note ? `${note} (${transferType})` : transferType,
          actor_name: actorName,
        },
        { transaction: t }
      );
    }

    // 도착 공장에 재고 생성 (새 바코드 발급)
    const transferDate = now.toDate();
    const transferExpiration = now.add(item.expiration_date || 365, "day").format("YYYY-MM-DD");
    const transferBarcode = generateBarcode(
      itemId,
      transferDate,
      transferDate,
      transferExpiration
    );
    
    const inv = await Inventories.create(
      {
        item_id: itemId,
        factory_id: destFactoryId,
        storage_condition_id: storageConditionId,
        barcode: transferBarcode,
        wholesale_price: 0,
        quantity: issued,
        received_at: transferDate,
        first_received_at: transferDate,
        expiration_date: transferExpiration,
        status: "Normal",
        unit: String(unit).trim(),
      },
      { transaction: t }
    );

    // IN 이력
    await InventoryMovement.create(
      {
        type: "TRANSFER_IN",
        item_id: itemId,
        barcode: inv.barcode,
        quantity: issued,
        unit,
        from_factory_id: sourceFactoryId,
        to_factory_id: destFactoryId,
        note: note ? `${note} (${transferType})` : transferType,
        actor_name: actorName,
      },
      { transaction: t }
    );

    const sourceFactory = await Factory.findByPk(sourceFactoryId);
    const destFactory = await Factory.findByPk(destFactoryId);

    return {
      moved: issued,
      lotId: inv.id,
      traces,
      userInfo,
      message: `${actorName}님이 ${item.name}을(를) ${sourceFactory.name}에서 ${destFactory.name}(으)로 ${issued}${unit} 이동했습니다`,
    };
  });
};

/* ===============================
 * 🔹 일괄 출고 처리 (배송 관리용)
 * =============================== */
exports.batchIssueTransactions = async (transactions, userId) => {
  const results = [];
  const errors = [];

  for (const [index, txn] of transactions.entries()) {
    try {
      const result = await exports.issueTransaction(
        {
          itemId: txn.itemId,
          factoryId: txn.factoryId,
          quantity: txn.quantity,
          unit: txn.unit,
          issueType: "SHIPPING",
          shippingInfo: {
            recipientName: txn.recipientName,
            recipientPhone: txn.recipientPhone,
            recipientAddress: txn.recipientAddress,
            shippingCompany: txn.shippingCompany,
            trackingNumber: txn.trackingNumber,
          },
          note: txn.note,
        },
        userId
      );
      results.push({ index, success: true, data: result });
    } catch (error) {
      errors.push({ index, success: false, error: error.message });
    }
  }

  return {
    total: transactions.length,
    success: results.length,
    failed: errors.length,
    results,
    errors,
  };
};

/* ===============================
 * 🔹 트랜잭션 목록 조회
 * =============================== */
exports.listTransactions = async (filter = {}) => {
  const {
    type = "ALL",
    itemId,
    factoryId,
    startDate,
    endDate,
    userId,
    page = 1,
    limit = 20,
  } = filter;

  // 페이지와 리미트를 명시적으로 숫자로 변환
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const where = {};

  // 타입 필터
  if (type !== "ALL") {
    if (type === "RECEIVE") {
      where.type = "RECEIVE";
    } else if (type === "ISSUE") {
      where.type = "ISSUE";
    } else if (type === "TRANSFER") {
      where.type = { [Op.in]: ["TRANSFER_OUT", "TRANSFER_IN"] };
    }
  }

  // 품목 필터
  if (itemId) where.item_id = Number(itemId);

  // 날짜 필터
  if (startDate) where.occurred_at = { [Op.gte]: new Date(startDate) };
  if (endDate)
    where.occurred_at = { ...(where.occurred_at ?? {}), [Op.lte]: new Date(endDate) };

  // 공장 필터
  if (factoryId) {
    const factoryIdNum = Number(factoryId);
    where[Op.or] = [
      { from_factory_id: factoryIdNum },
      { to_factory_id: factoryIdNum },
    ];
  }

  // 사용자 필터 (actor_name으로 검색)
  if (userId) {
    const userIdNum = Number(userId);
    const user = await User.findByPk(userIdNum, {
      include: [{ model: UserProfile, as: "UserProfile", attributes: ["full_name"] }],
    });
    if (user && user.UserProfile) {
      where.actor_name = user.UserProfile.full_name;
    }
  }

  const { rows, count } = await InventoryMovement.findAndCountAll({
    where,
    include: [
      { model: Items, attributes: ["id", "code", "name", "category"], required: false },
      { model: Factory, as: "fromFactory", attributes: ["id", "name"], required: false },
      { model: Factory, as: "toFactory", attributes: ["id", "name"], required: false },
    ],
    order: [
      [sequelize.fn('COALESCE', sequelize.col('occurred_at'), sequelize.col('InventoryMovement.created_at')), "DESC"],
      ["id", "DESC"],
    ],
    offset: (pageNum - 1) * limitNum,
    limit: limitNum,
  });

  // 이전: type은 한글로 반환됨
  // const korType = (t) =>
  //   ({
  //     RECEIVE: "입고",
  //     ISSUE: "출고",
  //     TRANSFER_OUT: "이동(출발)",
  //     TRANSFER_IN: "이동(도착)",
  //   }[t] ?? t);

  // 요청된 대로 DB에 저장된 type 값을 그대로 반환(type 필드는 영문)
  const data = rows.map((r) => ({
    id: r.id,
    time: r.occurred_at 
      ? dayjs(r.occurred_at).format("YYYY-MM-DD HH:mm:ss")
      : dayjs(r.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    type: r.type, // <---- DB의 영문 type 그대로 반환
    item: r.Item
      ? {
          id: r.Item.id,
          code: r.Item.code,
          name: r.Item.name,
          category: r.Item.category,
        }
      : null,
    barcode: r.barcode || "N/A",
    quantity: Number(r.quantity) || 0,
    unit: r.unit || "",
    fromFactory: r.fromFactory
      ? { id: r.fromFactory.id, name: r.fromFactory.name }
      : null,
    toFactory: r.toFactory
      ? { id: r.toFactory.id, name: r.toFactory.name }
      : null,
    actorName: r.actor_name || "시스템",
    note: r.note || "",
    createdAt: r.createdAt,
  }));

  return {
    items: data,
    meta: {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum),
    },
  };
};

/* ===============================
 * 🔹 트랜잭션 상세 조회
 * =============================== */
exports.getTransactionById = async (id) => {
  const movement = await InventoryMovement.findByPk(id, {
    include: [
      { model: Items, attributes: ["id", "code", "name", "category"] },
      { model: Factory, as: "fromFactory", attributes: ["id", "name"] },
      { model: Factory, as: "toFactory", attributes: ["id", "name"] },
    ],
  });

  if (!movement) {
    throw new Error("트랜잭션을 찾을 수 없습니다");
  }

  // DB의 type 값을 그대로 반환 (한글 변환 X)
  return {
    id: movement.id,
    type: movement.type, // <--- 영문 type 그대로 반환
    item: movement.Item
      ? {
          id: movement.Item.id,
          code: movement.Item.code,
          name: movement.Item.name,
          category: movement.Item.category,
        }
      : null,
    lotNumber: movement.lot_number,
    quantity: Number(movement.quantity),
    unit: movement.unit,
    fromFactory: movement.fromFactory
      ? { id: movement.fromFactory.id, name: movement.fromFactory.name }
      : null,
    toFactory: movement.toFactory
      ? { id: movement.toFactory.id, name: movement.toFactory.name }
      : null,
    actorName: movement.actor_name,
    note: movement.note,
    occurredAt: movement.occurred_at,
    createdAt: movement.createdAt,
    updatedAt: movement.updatedAt,
  };
};

/* ===============================
 * 🔹 트랜잭션 통계
 * =============================== */
exports.getTransactionStats = async (filter = {}) => {
  const { factoryId, startDate, endDate, groupBy = "day" } = filter;

  const where = {};
  if (startDate) where.occurred_at = { [Op.gte]: new Date(startDate) };
  if (endDate)
    where.occurred_at = { ...(where.occurred_at ?? {}), [Op.lte]: new Date(endDate) };
  if (factoryId) {
    const factoryIdNum = Number(factoryId);
    where[Op.or] = [
      { from_factory_id: factoryIdNum },
      { to_factory_id: factoryIdNum },
    ];
  }

  // 타입별 통계
  const typeCounts = await InventoryMovement.findAll({
    attributes: [
      "type",
      [fn("COUNT", col("id")), "count"],
      [fn("SUM", col("quantity")), "totalQuantity"],
    ],
    where,
    group: ["type"],
    raw: true,
  });

  // 품목별 통계 (상위 10개)
  const itemStats = await InventoryMovement.findAll({
    attributes: [
      "item_id",
      [fn("COUNT", col("InventoryMovement.id")), "count"],
      [fn("SUM", col("quantity")), "totalQuantity"],
    ],
    where,
    include: [{ model: Items, attributes: ["code", "name"] }],
    group: ["item_id"],
    order: [[fn("COUNT", col("InventoryMovement.id")), "DESC"]],
    limit: 10,
    raw: false,
  });

  return {
    summary: {
      totalTransactions: typeCounts.reduce(
        (sum, t) => sum + Number(t.count),
        0
      ),
      byType: typeCounts.map((t) => ({
        type: t.type,
        count: Number(t.count),
        totalQuantity: Number(t.totalQuantity || 0),
      })),
    },
    topItems: itemStats.map((s) => ({
      itemId: s.item_id,
      itemCode: s.Item?.code,
      itemName: s.Item?.name,
      transactionCount: Number(s.get("count")),
      totalQuantity: Number(s.get("totalQuantity") || 0),
    })),
  };
};

