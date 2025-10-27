/**
 * 공장/창고 간 이동 서비스
 * - 공장 → 공장
 * - 공장 → 창고  
 * - 창고 → 공장
 * - 창고 → 창고
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
const { Op } = require("sequelize");
const dayjs = require("dayjs");

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
        lotNumber: lot.lot_number,
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
 * 🔹 공장/창고 타입 한글 변환
 * =============================== */
function getLocationTypeLabel(type) {
  const labels = {
    "1PreProcessing": "1공장(전처리)",
    "2Manufacturing": "2공장(제조)",
    "Warehouse": "창고",
  };
  return labels[type] || type;
}

/* ===============================
 * 🔹 공장/창고 간 이동 (통합)
 * =============================== */
exports.transferBetweenLocations = async (payload, userId) => {
  const {
    itemId,
    sourceLocationId,
    destLocationId,
    storageConditionId,
    quantity,
    unit,
    transferType = "OTHER",
    note,
  } = payload;

  if (sourceLocationId === destLocationId) {
    throw new Error("출발지와 도착지가 동일합니다");
  }

  // 사용자 정보 조회
  let actorName = "시스템";
  let userInfo = null;

  if (userId) {
    const user = await User.findByPk(userId, {
      include: [{ model: UserProfile, attributes: ["full_name", "position"] }],
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

  // 출발지 조회
  const sourceLocation = await Factory.findByPk(sourceLocationId);
  if (!sourceLocation) {
    throw new Error(`출발지(ID: ${sourceLocationId})를 찾을 수 없습니다`);
  }

  // 도착지 조회
  const destLocation = await Factory.findByPk(destLocationId);
  if (!destLocation) {
    throw new Error(`도착지(ID: ${destLocationId})를 찾을 수 없습니다`);
  }

  // 이동 유형 결정
  const sourceType = sourceLocation.type;
  const destType = destLocation.type;
  let movementDescription = "";

  if (
    sourceType === "1PreProcessing" &&
    destType === "2Manufacturing"
  ) {
    movementDescription = "전처리 → 제조";
  } else if (
    sourceType === "2Manufacturing" &&
    destType === "Warehouse"
  ) {
    movementDescription = "제조 → 창고";
  } else if (
    sourceType === "Warehouse" &&
    destType === "2Manufacturing"
  ) {
    movementDescription = "창고 → 제조";
  } else if (
    sourceType === "1PreProcessing" &&
    destType === "Warehouse"
  ) {
    movementDescription = "전처리 → 창고";
  } else if (
    sourceType === "Warehouse" &&
    destType === "1PreProcessing"
  ) {
    movementDescription = "창고 → 전처리";
  } else if (
    sourceType === "2Manufacturing" &&
    destType === "1PreProcessing"
  ) {
    movementDescription = "제조 → 전처리";
  } else {
    movementDescription = `${getLocationTypeLabel(
      sourceType
    )} → ${getLocationTypeLabel(destType)}`;
  }

  return sequelize.transaction(async (t) => {
    // 출발지에서 재고 출고 (FIFO)
    const { issued, traces } = await fifoIssue({
      itemId,
      factoryId: sourceLocationId,
      quantity,
      t,
    });

    const now = dayjs();

    // OUT 이력 생성
    for (const tr of traces) {
      await InventoryMovement.create(
        {
          type: "TRANSFER_OUT",
          item_id: itemId,
          lot_number: tr.lotNumber,
          quantity: tr.take,
          unit,
          from_factory_id: sourceLocationId,
          to_factory_id: destLocationId,
          note: note
            ? `${note} (${movementDescription}, ${transferType})`
            : `${movementDescription} (${transferType})`,
          actor_name: actorName,
        },
        { transaction: t }
      );
    }

    // 도착지에 재고 생성
    const lotNum = `TR-${itemId}-${now.valueOf()}`;
    const inv = await Inventories.create(
      {
        item_id: itemId,
        factory_id: destLocationId,
        storage_condition_id: storageConditionId,
        lot_number: lotNum,
        wholesale_price: 0,
        quantity: issued,
        received_at: now.toDate(),
        first_received_at: now.toDate(),
        expiration_date: now
          .add(item.expiration_date || 365, "day")
          .format("YYYY-MM-DD"),
        status: "Normal",
        unit: String(unit).trim(),
      },
      { transaction: t }
    );

    // IN 이력 생성
    await InventoryMovement.create(
      {
        type: "TRANSFER_IN",
        item_id: itemId,
        lot_number: inv.lot_number,
        quantity: issued,
        unit,
        from_factory_id: sourceLocationId,
        to_factory_id: destLocationId,
        note: note
          ? `${note} (${movementDescription}, ${transferType})`
          : `${movementDescription} (${transferType})`,
        actor_name: actorName,
      },
      { transaction: t }
    );

    return {
      moved: issued,
      newLotId: inv.id,
      newLotNumber: inv.lot_number,
      traces,
      userInfo,
      movementType: movementDescription,
      sourceLocation: {
        id: sourceLocation.id,
        name: sourceLocation.name,
        type: sourceLocation.type,
        typeLabel: getLocationTypeLabel(sourceLocation.type),
      },
      destLocation: {
        id: destLocation.id,
        name: destLocation.name,
        type: destLocation.type,
        typeLabel: getLocationTypeLabel(destLocation.type),
      },
      message: `${actorName}님이 ${item.name}을(를) ${sourceLocation.name}(${getLocationTypeLabel(
        sourceType
      )})에서 ${destLocation.name}(${getLocationTypeLabel(
        destType
      )})(으)로 ${issued}${unit} 이동했습니다`,
    };
  });
};

/* ===============================
 * 🔹 이동 이력 조회 (공장/창고 구분)
 * =============================== */
exports.getTransferHistory = async (filter = {}) => {
  const {
    itemId,
    locationId,
    sourceType,
    destType,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = filter;

  const where = {
    type: { [Op.in]: ["TRANSFER_OUT", "TRANSFER_IN"] },
  };

  if (itemId) where.item_id = itemId;
  if (startDate) where.occurred_at = { [Op.gte]: new Date(startDate) };
  if (endDate)
    where.occurred_at = {
      ...(where.occurred_at ?? {}),
      [Op.lte]: new Date(endDate),
    };

  if (locationId) {
    where[Op.or] = [
      { from_factory_id: locationId },
      { to_factory_id: locationId },
    ];
  }

  const include = [
    { model: Items, attributes: ["id", "code", "name", "category"] },
    { model: Factory, as: "fromFactory", attributes: ["id", "name", "type"] },
    { model: Factory, as: "toFactory", attributes: ["id", "name", "type"] },
  ];

  // 출발지 타입 필터
  if (sourceType) {
    include[1].where = { type: sourceType };
    include[1].required = true;
  }

  // 도착지 타입 필터
  if (destType) {
    include[2].where = { type: destType };
    include[2].required = true;
  }

  const { rows, count } = await InventoryMovement.findAndCountAll({
    where,
    include,
    order: [
      ["occurred_at", "DESC"],
      ["id", "DESC"],
    ],
    offset: (page - 1) * limit,
    limit,
  });

  const data = rows.map((r) => ({
    id: r.id,
    time: dayjs(r.occurred_at).format("YYYY-MM-DD HH:mm:ss"),
    type: r.type === "TRANSFER_OUT" ? "이동(출발)" : "이동(도착)",
    typeRaw: r.type,
    item: r.Item
      ? {
          id: r.Item.id,
          code: r.Item.code,
          name: r.Item.name,
          category: r.Item.category,
        }
      : null,
    lotNumber: r.lot_number,
    quantity: Number(r.quantity),
    unit: r.unit,
    sourceLocation: r.fromFactory
      ? {
          id: r.fromFactory.id,
          name: r.fromFactory.name,
          type: r.fromFactory.type,
          typeLabel: getLocationTypeLabel(r.fromFactory.type),
        }
      : null,
    destLocation: r.toFactory
      ? {
          id: r.toFactory.id,
          name: r.toFactory.name,
          type: r.toFactory.type,
          typeLabel: getLocationTypeLabel(r.toFactory.type),
        }
      : null,
    actorName: r.actor_name,
    note: r.note,
    occurredAt: r.occurred_at,
  }));

  return {
    items: data,
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

/* ===============================
 * 🔹 특정 이동 경로 통계
 * =============================== */
exports.getTransferPathStats = async (filter = {}) => {
  const { startDate, endDate } = filter;

  const where = {
    type: { [Op.in]: ["TRANSFER_OUT", "TRANSFER_IN"] },
  };

  if (startDate) where.occurred_at = { [Op.gte]: new Date(startDate) };
  if (endDate)
    where.occurred_at = {
      ...(where.occurred_at ?? {}),
      [Op.lte]: new Date(endDate),
    };

  const movements = await InventoryMovement.findAll({
    where,
    include: [
      { model: Factory, as: "fromFactory", attributes: ["id", "name", "type"] },
      { model: Factory, as: "toFactory", attributes: ["id", "name", "type"] },
    ],
    raw: false,
  });

  // 경로별 집계
  const pathStats = {};

  movements.forEach((m) => {
    if (m.fromFactory && m.toFactory) {
      const key = `${m.fromFactory.name}(${getLocationTypeLabel(
        m.fromFactory.type
      )}) → ${m.toFactory.name}(${getLocationTypeLabel(m.toFactory.type)})`;

      if (!pathStats[key]) {
        pathStats[key] = {
          path: key,
          count: 0,
          totalQuantity: 0,
          sourceLocation: {
            id: m.fromFactory.id,
            name: m.fromFactory.name,
            type: m.fromFactory.type,
            typeLabel: getLocationTypeLabel(m.fromFactory.type),
          },
          destLocation: {
            id: m.toFactory.id,
            name: m.toFactory.name,
            type: m.toFactory.type,
            typeLabel: getLocationTypeLabel(m.toFactory.type),
          },
        };
      }

      pathStats[key].count++;
      pathStats[key].totalQuantity += Number(m.quantity);
    }
  });

  // 배열로 변환 및 정렬 (이동 건수 많은 순)
  const sortedStats = Object.values(pathStats).sort(
    (a, b) => b.count - a.count
  );

  return {
    summary: {
      totalPaths: sortedStats.length,
      totalTransfers: sortedStats.reduce((sum, s) => sum + s.count, 0),
    },
    paths: sortedStats,
  };
};

