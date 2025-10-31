/**
 * 입고/출고 예정 트랜잭션 서비스
 */
const db = require("../../models");
const {
  PlannedTransaction,
  Items,
  Factory,
  User,
  UserProfile,
  StorageCondition,
  sequelize,
} = db;
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const inventoryTransactionService = require("./inventoryTransactionService");

/* ===============================
 * 🔹 예정 트랜잭션 생성
 * =============================== */
exports.createPlanned = async (payload, userId) => {
  const {
    transactionType,
    itemId,
    factoryId,
    quantity,
    unit,
    scheduledDate,
    supplierName,
    barcode,
    wholesalePrice,
    storageConditionId,
    customerName,
    issueType,
    shippingAddress,
    notes,
  } = payload;

  // 품목 존재 확인
  const item = await Items.findByPk(itemId);
  if (!item) {
    throw new Error(`품목(ID: ${itemId})을 찾을 수 없습니다`);
  }

  // 공장 존재 확인
  const factory = await Factory.findByPk(factoryId);
  if (!factory) {
    throw new Error(`공장(ID: ${factoryId})을 찾을 수 없습니다`);
  }

  // ✅ Items 테이블에 정의된 unit 사용
  const itemUnit = item.unit || "EA";

  const planned = await PlannedTransaction.create({
    transaction_type: transactionType,
    item_id: itemId,
    factory_id: factoryId,
    quantity: Number(quantity),
    unit: itemUnit, // ✅ 품목의 unit 자동 사용
    scheduled_date: scheduledDate,
    requested_by_user_id: userId || null,
    status: "PENDING",
    supplier_name: supplierName || null,
    barcode: barcode || null,
    wholesale_price: wholesalePrice ? Number(wholesalePrice) : null,
    storage_condition_id: storageConditionId || null,
    customer_name: customerName || null,
    issue_type: issueType || null,
    shipping_address: shippingAddress || null,
    notes: notes || null,
  });

  return {
    planned,
    message: `${transactionType === "RECEIVE" ? "입고" : "출고"} 예정이 등록되었습니다`,
  };
};

/* ===============================
 * 🔹 예정 트랜잭션 목록 조회
 * =============================== */
exports.listPlanned = async (filter = {}) => {
  const {
    transactionType = "ALL",
    status = "ALL",
    itemId,
    factoryId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = filter;

  const pageNum = Number(page);
  const limitNum = Number(limit);

  const where = {};

  // 트랜잭션 타입 필터
  if (transactionType !== "ALL") {
    where.transaction_type = transactionType;
  }

  // 상태 필터
  if (status !== "ALL") {
    where.status = status;
  }

  // 품목 필터
  if (itemId) where.item_id = Number(itemId);

  // 공장 필터
  if (factoryId) where.factory_id = Number(factoryId);

  // 날짜 필터 (예정일 기준)
  if (startDate) where.scheduled_date = { [Op.gte]: new Date(startDate) };
  if (endDate)
    where.scheduled_date = {
      ...(where.scheduled_date ?? {}),
      [Op.lte]: new Date(endDate),
    };

  const { rows, count } = await PlannedTransaction.findAndCountAll({
    where,
    include: [
      { model: Items, attributes: ["id", "code", "name", "category"] },
      { model: Factory, attributes: ["id", "name", "type"] },
      {
        model: User,
        as: "RequestedBy",
        attributes: ["id"],
        include: [
          {
            model: UserProfile,
            as: "UserProfile",
            attributes: ["full_name", "position"],
          },
        ],
        required: false,
      },
      {
        model: User,
        as: "ApprovedBy",
        attributes: ["id"],
        include: [
          {
            model: UserProfile,
            as: "UserProfile",
            attributes: ["full_name", "position"],
          },
        ],
        required: false,
      },
      { model: StorageCondition, attributes: ["id", "name"], required: false },
    ],
    order: [
      ["scheduled_date", "ASC"],
      ["created_at", "DESC"],
    ],
    offset: (pageNum - 1) * limitNum,
    limit: limitNum,
  });

  const korType = (t) => (t === "RECEIVE" ? "입고" : "출고");
  const korStatus = (s) =>
    ({
      PENDING: "대기",
      APPROVED: "승인됨",
      COMPLETED: "완료",
      CANCELLED: "취소",
    }[s] ?? s);

  const data = rows.map((r) => ({
    id: r.id,
    transactionType: r.transaction_type,
    transactionTypeName: korType(r.transaction_type),
    status: r.status,
    statusName: korStatus(r.status),
    item: r.Item
      ? {
          id: r.Item.id,
          code: r.Item.code,
          name: r.Item.name,
          category: r.Item.category,
        }
      : null,
    factory: r.Factory
      ? { id: r.Factory.id, name: r.Factory.name, type: r.Factory.type }
      : null,
    quantity: Number(r.quantity),
    unit: r.unit,
    scheduledDate: dayjs(r.scheduled_date).format("YYYY-MM-DD"),
    requestedBy: r.RequestedBy?.UserProfile
      ? {
          userId: r.RequestedBy.id,
          name: r.RequestedBy.UserProfile.full_name,
          position: r.RequestedBy.UserProfile.position,
        }
      : { userId: r.requested_by_user_id, name: "시스템" },
    approvedBy: r.ApprovedBy?.UserProfile
      ? {
          userId: r.ApprovedBy.id,
          name: r.ApprovedBy.UserProfile.full_name,
          position: r.ApprovedBy.UserProfile.position,
        }
      : null,
    approvedAt: r.approved_at ? dayjs(r.approved_at).format("YYYY-MM-DD HH:mm:ss") : null,
    completedAt: r.completed_at ? dayjs(r.completed_at).format("YYYY-MM-DD HH:mm:ss") : null,
    supplierName: r.supplier_name,
    customerName: r.customer_name,
    storageCondition: r.StorageCondition
      ? { id: r.StorageCondition.id, name: r.StorageCondition.name }
      : null,
    notes: r.notes,
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
 * 🔹 예정 트랜잭션 상세 조회
 * =============================== */
exports.getPlannedById = async (id) => {
  const planned = await PlannedTransaction.findByPk(id, {
    include: [
      { model: Items, attributes: ["id", "code", "name", "category", "expiration_date"] },
      { model: Factory, attributes: ["id", "name", "type"] },
      {
        model: User,
        as: "RequestedBy",
        attributes: ["id"],
        include: [
          {
            model: UserProfile,
            as: "UserProfile",
            attributes: ["full_name", "position", "department"],
          },
        ],
        required: false,
      },
      {
        model: User,
        as: "ApprovedBy",
        attributes: ["id"],
        include: [
          {
            model: UserProfile,
            as: "UserProfile",
            attributes: ["full_name", "position"],
          },
        ],
        required: false,
      },
      {
        model: User,
        as: "CompletedBy",
        attributes: ["id"],
        include: [
          {
            model: UserProfile,
            as: "UserProfile",
            attributes: ["full_name", "position"],
          },
        ],
        required: false,
      },
      { model: StorageCondition, attributes: ["id", "name", "temperature_min", "temperature_max"], required: false },
    ],
  });

  if (!planned) {
    throw new Error("예정 트랜잭션을 찾을 수 없습니다");
  }

  const korType = (t) => (t === "RECEIVE" ? "입고" : "출고");
  const korStatus = (s) =>
    ({
      PENDING: "대기",
      APPROVED: "승인됨",
      COMPLETED: "완료",
      CANCELLED: "취소",
    }[s] ?? s);

  return {
    id: planned.id,
    transactionType: planned.transaction_type,
    transactionTypeName: korType(planned.transaction_type),
    status: planned.status,
    statusName: korStatus(planned.status),
    item: planned.Item,
    factory: planned.Factory,
    quantity: Number(planned.quantity),
    unit: planned.unit,
    scheduledDate: planned.scheduled_date,
    requestedBy: planned.RequestedBy?.UserProfile
      ? {
          userId: planned.RequestedBy.id,
          name: planned.RequestedBy.UserProfile.full_name,
          position: planned.RequestedBy.UserProfile.position,
          department: planned.RequestedBy.UserProfile.department,
        }
      : { userId: planned.requested_by_user_id, name: "시스템" },
    approvedBy: planned.ApprovedBy?.UserProfile
      ? {
          userId: planned.ApprovedBy.id,
          name: planned.ApprovedBy.UserProfile.full_name,
          position: planned.ApprovedBy.UserProfile.position,
        }
      : null,
    completedBy: planned.CompletedBy?.UserProfile
      ? {
          userId: planned.CompletedBy.id,
          name: planned.CompletedBy.UserProfile.full_name,
          position: planned.CompletedBy.UserProfile.position,
        }
      : null,
    approvedAt: planned.approved_at,
    completedAt: planned.completed_at,
    supplierName: planned.supplier_name,
    barcode: planned.barcode,
    wholesalePrice: planned.wholesale_price ? Number(planned.wholesale_price) : null,
    storageCondition: planned.StorageCondition,
    customerName: planned.customer_name,
    issueType: planned.issue_type,
    shippingAddress: planned.shipping_address,
    notes: planned.notes,
    rejectionReason: planned.rejection_reason,
    createdAt: planned.createdAt,
    updatedAt: planned.updatedAt,
  };
};

/* ===============================
 * 🔹 예정 트랜잭션 수정
 * =============================== */
exports.updatePlanned = async (id, payload) => {
  const planned = await PlannedTransaction.findByPk(id);
  if (!planned) {
    throw new Error("예정 트랜잭션을 찾을 수 없습니다");
  }

  if (planned.status !== "PENDING") {
    throw new Error("대기 상태인 항목만 수정할 수 있습니다");
  }

  const updateData = {};
  if (payload.quantity !== undefined) updateData.quantity = Number(payload.quantity);
  if (payload.unit !== undefined) updateData.unit = String(payload.unit).trim();
  if (payload.scheduledDate !== undefined) updateData.scheduled_date = payload.scheduledDate;
  if (payload.supplierName !== undefined) updateData.supplier_name = payload.supplierName;
  if (payload.barcode !== undefined) updateData.barcode = payload.barcode;
  if (payload.wholesalePrice !== undefined) updateData.wholesale_price = Number(payload.wholesalePrice);
  if (payload.storageConditionId !== undefined) updateData.storage_condition_id = payload.storageConditionId;
  if (payload.customerName !== undefined) updateData.customer_name = payload.customerName;
  if (payload.issueType !== undefined) updateData.issue_type = payload.issueType;
  if (payload.shippingAddress !== undefined) updateData.shipping_address = payload.shippingAddress;
  if (payload.notes !== undefined) updateData.notes = payload.notes;

  await planned.update(updateData);

  return {
    planned,
    message: "예정 트랜잭션이 수정되었습니다",
  };
};

/* ===============================
 * 🔹 예정 트랜잭션 승인
 * =============================== */
exports.approvePlanned = async (id, userId, comment) => {
  const planned = await PlannedTransaction.findByPk(id);
  if (!planned) {
    throw new Error("예정 트랜잭션을 찾을 수 없습니다");
  }

  if (planned.status !== "PENDING") {
    throw new Error("대기 상태인 항목만 승인할 수 있습니다");
  }

  await planned.update({
    status: "APPROVED",
    approved_by_user_id: userId || "system",
    approved_at: new Date(),
  });

  return {
    planned,
    message: "예정 트랜잭션이 승인되었습니다",
  };
};

/* ===============================
 * 🔹 예정 트랜잭션 거부/취소
 * =============================== */
exports.rejectPlanned = async (id, rejectionReason) => {
  const planned = await PlannedTransaction.findByPk(id);
  if (!planned) {
    throw new Error("예정 트랜잭션을 찾을 수 없습니다");
  }

  if (planned.status === "COMPLETED") {
    throw new Error("완료된 항목은 취소할 수 없습니다");
  }

  await planned.update({
    status: "CANCELLED",
    rejection_reason: rejectionReason,
  });

  return {
    planned,
    message: "예정 트랜잭션이 취소되었습니다",
  };
};

/* ===============================
 * 🔹 예정 입고 → 실제 입고 처리
 * =============================== */
exports.completePlannedReceive = async (id, payload, userId) => {
  const planned = await PlannedTransaction.findByPk(id, {
    include: [{ model: Items }],
  });

  if (!planned) {
    throw new Error("예정 트랜잭션을 찾을 수 없습니다");
  }

  if (planned.transaction_type !== "RECEIVE") {
    throw new Error("입고 예정 항목만 입고 처리할 수 있습니다");
  }

  if (planned.status !== "APPROVED" && planned.status !== "PENDING") {
    throw new Error("승인된 항목만 입고 처리할 수 있습니다");
  }

  // 실제 입고 처리 (barcode가 있으면 그대로 사용, 없으면 자동 생성) ✅
  const receivePayload = {
    itemId: planned.item_id,
    factoryId: planned.factory_id,
    storageConditionId: planned.storage_condition_id || 1, // 기본 보관 조건
    wholesalePrice: planned.wholesale_price || 0,
    quantity: payload.actualQuantity || planned.quantity,
    unit: planned.unit,
    receivedAt: payload.receivedAt || new Date(),
    firstReceivedAt: payload.receivedAt || new Date(),
    note: payload.note || `예정 입고 완료 (ID: ${planned.id})`,
    barcode: planned.barcode || null, // 공장 이동 시 기존 바코드 유지 ✅
  };

  const receiveResult = await inventoryTransactionService.receiveTransaction(
    receivePayload,
    userId
  );

  // 예정 트랜잭션 완료 처리
  await planned.update({
    status: "COMPLETED",
    completed_by_user_id: userId || "system",
    completed_at: new Date(),
  });

  return {
    planned,
    inventory: receiveResult.inventory,
    message: `입고가 완료되었습니다. 재고 ID: ${receiveResult.inventory.id}`,
  };
};

/* ===============================
 * 🔹 예정 출고 → 실제 출고 처리
 * =============================== */
exports.completePlannedIssue = async (id, payload, userId) => {
  const planned = await PlannedTransaction.findByPk(id, {
    include: [{ model: Items }],
  });

  if (!planned) {
    throw new Error("예정 트랜잭션을 찾을 수 없습니다");
  }

  if (planned.transaction_type !== "ISSUE") {
    throw new Error("출고 예정 항목만 출고 처리할 수 있습니다");
  }

  if (planned.status !== "APPROVED" && planned.status !== "PENDING") {
    throw new Error("승인된 항목만 출고 처리할 수 있습니다");
  }

  // 실제 출고 처리
  const issuePayload = {
    itemId: planned.item_id,
    factoryId: planned.factory_id,
    quantity: payload.actualQuantity || planned.quantity,
    unit: planned.unit,
    issueType: planned.issue_type || "OTHER",
    shippingInfo: payload.shippingInfo || {
      recipientName: planned.customer_name,
      recipientAddress: planned.shipping_address,
    },
    note: payload.note || `예정 출고 완료 (ID: ${planned.id})`,
  };

  const issueResult = await inventoryTransactionService.issueTransaction(
    issuePayload,
    userId
  );

  // 예정 트랜잭션 완료 처리
  await planned.update({
    status: "COMPLETED",
    completed_by_user_id: userId || "system",
    completed_at: new Date(),
  });

  return {
    planned,
    issued: issueResult.issued,
    traces: issueResult.traces,
    message: `출고가 완료되었습니다. 출고 수량: ${issueResult.issued}${planned.unit}`,
  };
};

/* ===============================
 * 🔹 예정 트랜잭션 삭제
 * =============================== */
exports.deletePlanned = async (id) => {
  const planned = await PlannedTransaction.findByPk(id);
  if (!planned) {
    throw new Error("예정 트랜잭션을 찾을 수 없습니다");
  }

  // APPROVED 상태만 삭제 불가 (승인되었지만 아직 완료되지 않은 것)
  if (planned.status === "APPROVED") {
    throw new Error("승인된 항목은 삭제할 수 없습니다. 먼저 취소하거나 완료 처리해 주세요.");
  }

  await planned.destroy();

  const statusMap = {
    PENDING: "대기",
    APPROVED: "승인됨",
    COMPLETED: "완료",
    CANCELLED: "취소",
  };

  return {
    message: `${statusMap[planned.status] || planned.status} 상태의 예정 트랜잭션이 삭제되었습니다`,
  };
};

/* ===============================
 * 🔹 통계
 * =============================== */
exports.getPlannedStats = async (filter = {}) => {
  const { transactionType, factoryId, startDate, endDate } = filter;

  const where = {};
  if (transactionType && transactionType !== "ALL") where.transaction_type = transactionType;
  if (factoryId) where.factory_id = Number(factoryId);
  if (startDate) where.scheduled_date = { [Op.gte]: new Date(startDate) };
  if (endDate)
    where.scheduled_date = {
      ...(where.scheduled_date ?? {}),
      [Op.lte]: new Date(endDate),
    };

  const [statusCounts, typeCounts] = await Promise.all([
    PlannedTransaction.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalQuantity"],
      ],
      where,
      group: ["status"],
      raw: true,
    }),
    PlannedTransaction.findAll({
      attributes: [
        "transaction_type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalQuantity"],
      ],
      where,
      group: ["transaction_type"],
      raw: true,
    }),
  ]);

  return {
    byStatus: statusCounts.map((s) => ({
      status: s.status,
      count: Number(s.count),
      totalQuantity: Number(s.totalQuantity || 0),
    })),
    byType: typeCounts.map((t) => ({
      type: t.transaction_type,
      count: Number(t.count),
      totalQuantity: Number(t.totalQuantity || 0),
    })),
  };
};

