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
const { Op, Transaction, Sequelize } = require("sequelize");
const dayjs = require("dayjs");
const inventoryTransactionService = require("./inventoryTransactionService");

/* ===============================
 * 🔹 예정 트랜잭션 생성
 * =============================== */
const toNumber = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v.replace(/,/g, '').trim());
  return NaN;
};

exports.createPlanned = async (payload, userId) => {
  const {
    transactionType,
    itemId,                // 선택
    itemCode,              // ✅ 선택: 코드로도 생성 허용 (예: 'FIN005')
    factoryId,
    quantity,
    unit,                  // 선택 (item.unit 우선)
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

  if (transactionType !== 'RECEIVE' && transactionType !== 'ISSUE') {
    throw new Error('transactionType은 RECEIVE 또는 ISSUE만 허용됩니다');
  }

  // 1) 품목 조회: id → code → (선택) barcode
  let item = null;
  if (itemId != null && String(itemId).trim() !== '') {
    item = await Items.findByPk(itemId);
  }
  if (!item && itemCode != null && String(itemCode).trim() !== '') {
    item = await Items.findOne({ where: { code: String(itemCode).trim() } });
  }
  if (!item && barcode != null && String(barcode).trim() !== '') {
    item = await Items.findOne({ where: { barcode: String(barcode).trim() } });
  }
  if (!item) {
    throw new Error('품목을 찾을 수 없습니다 (itemId 또는 itemCode를 확인하세요)');
  }

  // 2) 공장 확인
  const factory = await Factory.findByPk(factoryId);
  if (!factory) {
    throw new Error(`공장(ID: ${factoryId})을 찾을 수 없습니다`);
  }

  // 3) 수량/가격/날짜 검증
  const qty = toNumber(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error('수량이 올바르지 않습니다');
  }

  const price =
    wholesalePrice == null ? null : toNumber(wholesalePrice);

  const sch = scheduledDate ? new Date(scheduledDate) : null;
  if (!sch || Number.isNaN(sch.getTime())) {
    throw new Error('입고예정일이 올바르지 않습니다 (YYYY-MM-DD 권장)');
  }

  // 4) 단위 결정: 품목 단위 우선 → 요청 단위 → 'EA'
  const resolvedUnit =
    item.unit ?? (
      unit != null && String(unit).trim() !== '' ? String(unit).trim() : 'EA'
    );

  // 5) 생성
  const planned = await PlannedTransaction.create({
    transaction_type: transactionType,
    item_id: item.id,
    factory_id: Number(factoryId),
    quantity: qty,
    unit: resolvedUnit,
    scheduled_date: sch,
    requested_by_user_id: userId ?? null,
    status: 'PENDING',
    supplier_name: supplierName ?? null,
    barcode: barcode ?? null,
    wholesale_price: price,
    storage_condition_id: storageConditionId ?? null,
    customer_name: customerName ?? null,
    issue_type: issueType ?? null,
    shipping_address: shippingAddress ?? null,
    notes: notes ?? null,
  });

  return {
    planned,
    message: `${transactionType === 'RECEIVE' ? '입고' : '출고'} 예정이 등록되었습니다`,
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
exports.rejectPlanned = async (id) => {
  const planned = await PlannedTransaction.findByPk(id);
  if (!planned) {
    throw new Error("예정 트랜잭션을 찾을 수 없습니다");
  }

  await planned.update({
    status: "CANCELLED",
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

  const actualQty = Number(payload.actualQuantity);
  if (actualQty > Number(planned.quantity)) {
    throw new Error("예정 입고 수량보다 실제 입고 수량이 많습니다");
  }

  // 1) 실제 입고 처리
  const receivePayload = {
    itemId: planned.item_id,
    factoryId: planned.factory_id,
    storageConditionId: planned.storage_condition_id ?? 1,
    wholesalePrice: planned.wholesale_price ?? 0,
    quantity: actualQty,
    unit: planned.unit,
    receivedAt: payload.receivedAt ?? new Date(),
    firstReceivedAt: payload.receivedAt ?? new Date(),
    note: payload.note ?? `예정 입고 처리 (ID: ${planned.id}, ${actualQty}/${planned.quantity})`,
    barcode: planned.barcode ?? null,
  };

  const receiveResult = await inventoryTransactionService.receiveTransaction(
    receivePayload,
    userId
  );

  // 2) 남은 수량에 따라 예정 트랜잭션 상태/수량 갱신 및 부분 입고 완료 내역 저장
  const remaining = Number(planned.quantity) - actualQty;

  if (remaining === 0) {
    // 전체 입고 완료
    await planned.update({
      status: "COMPLETED",
      completed_by_user_id: userId || "system",
      completed_at: new Date(),
    });
  } else {
    // 부분 입고: 완료된 부분 입고 내역을 별도로 저장
    const completedPartial = await PlannedTransaction.create({
      transaction_type: "RECEIVE",
      item_id: planned.item_id,
      factory_id: planned.factory_id,
      quantity: actualQty, // 완료된 수량
      unit: planned.unit,
      status: "COMPLETED", // 완료 상태로 저장
      scheduled_date: planned.scheduled_date,
      requested_by_user_id: planned.requested_by_user_id,
      completed_by_user_id: userId || "system",
      completed_at: new Date(),
      supplier_name: planned.supplier_name,
      barcode: planned.barcode,
      wholesale_price: planned.wholesale_price,
      storage_condition_id: planned.storage_condition_id,
      notes: `부분 입고 완료 (원본 ID: ${planned.id}, ${actualQty}/${planned.quantity})`,
    });

    // 원본 예정 트랜잭션은 남은 수량으로 업데이트 (PENDING 상태 유지)
    await planned.update({
      status: "PENDING",
      quantity: remaining,
      updated_at: new Date(),
    });

    // 반환값에 완료된 부분 입고 내역 포함
    return {
      planned, // 갱신된 원본 인스턴스 (남은 수량)
      completedPartial, // 완료된 부분 입고 내역
      inventory: receiveResult.inventory,
      message: `부분 입고 처리됨 (${actualQty}${planned.unit}). 완료 내역 저장됨. 남은 예정 수량: ${remaining}${planned.unit}`,
    };
  }

  return {
    planned, // 갱신된 인스턴스
    inventory: receiveResult.inventory,
    message: `입고가 완료되었습니다. 재고 ID: ${receiveResult.inventory.id}`,
  };
};


function parseQty(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v.replace(/,/g, '').trim());
  return NaN;
}

exports.completePlannedReceive = async (id, payload, userId) => {
  // 0) 입력 수량 검증
  const actualQty = parseQty(payload.actualQuantity);
  if (!Number.isFinite(actualQty) || actualQty <= 0) {
    throw new Error('실제 입고 수량이 올바르지 않습니다');
  }

  // 1) 스냅샷(잠금 없이) — 실입고 페이로드 구성용
  const snapshot = await PlannedTransaction.findByPk(id, { include: [{ model: Items }] });
  if (!snapshot) throw new Error('예정 트랜잭션을 찾을 수 없습니다');
  if (snapshot.transaction_type !== 'RECEIVE') {
    throw new Error('입고 예정 항목만 입고 처리할 수 있습니다');
  }
  const plannedQty = Number(snapshot.quantity);
  if (!Number.isFinite(plannedQty)) {
    throw new Error('예정 수량이 손상되었습니다');
  }
  if (actualQty > plannedQty) {
    throw new Error('예정 입고 수량보다 실제 입고 수량이 많습니다');
  }

  // 2) "예정 수량 차감 + 상태 갱신"을 원자적 UPDATE 1회로, 아주 짧은 트랜잭션에서 실행
  let updated;               // 차감된 원본 예정건
  let completedPartial = null;
  await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (t) => {
      const escapedUser = sequelize.escape(userId ?? 'system');
      const [affected] = await PlannedTransaction.update(
        {
          // 수량 차감
          quantity: Sequelize.literal(`GREATEST(quantity - ${actualQty}, 0)`),
          // 상태/완료자/완료시각 조건 갱신
          status: Sequelize.literal(
            `CASE WHEN quantity - ${actualQty} <= 0 THEN 'COMPLETED' ELSE 'PENDING' END`
          ),
          completed_by_user_id: Sequelize.literal(
            `CASE WHEN quantity - ${actualQty} <= 0 THEN ${escapedUser} ELSE completed_by_user_id END`
          ),
          completed_at: Sequelize.literal(
            `CASE WHEN quantity - ${actualQty} <= 0 THEN NOW() ELSE completed_at END`
          ),
          updated_at: new Date(),
        },
        {
          where: {
            id,
            transaction_type: 'RECEIVE',
            quantity: { [Op.gte]: actualQty }, // 동시성 안전장치
          },
          transaction: t,
        }
      );

      if (affected === 0) {
        throw new Error('다른 요청에서 먼저 처리되었습니다. 새로고침 후 다시 시도해 주세요.');
      }

      updated = await PlannedTransaction.findByPk(id, { transaction: t });
      const remaining = Number(updated.quantity);

      // 부분 입고면 완료분을 별도 기록(정책 유지). 이 작업도 가볍기 때문에 여기서 처리해도 잠금시간에 큰 영향 없음
      if (remaining > 0) {
        completedPartial = await PlannedTransaction.create(
          {
            transaction_type: 'RECEIVE',
            item_id: updated.item_id,
            factory_id: updated.factory_id,
            quantity: actualQty, // 완료 수량
            unit: updated.unit,
            status: 'COMPLETED',
            scheduled_date: updated.scheduled_date,
            requested_by_user_id: updated.requested_by_user_id,
            completed_by_user_id: userId ?? 'system',
            completed_at: new Date(),
            supplier_name: updated.supplier_name,
            barcode: updated.barcode,
            wholesale_price: updated.wholesale_price,
            storage_condition_id: updated.storage_condition_id,
            notes: `부분 입고 완료 (원본 ID: ${updated.id}, ${actualQty}/${plannedQty})`,
            // parent_planned_id: updated.id, // 컬럼 있으면 추천
          },
          { transaction: t }
        );
      }
    }
  );

  // 3) 랜덤 바코드 생성 (입고 시 항상 새로 생성)
  const { generateBarcode } = require("../utils/barcodeGenerator");
  const randomBarcode = generateBarcode();
  
  // 4) 무거운 "실입고 처리"는 트랜잭션 밖에서 실행 → 잠금 없음 → 타임아웃 원인 제거
  const receivePayload = {
    itemId: snapshot.item_id,
    factoryId: snapshot.factory_id,
    storageConditionId: snapshot.storage_condition_id ?? 1,
    wholesalePrice: snapshot.wholesale_price ?? 0,
    quantity: actualQty,
    unit: snapshot.unit,
    receivedAt: payload.receivedAt ?? new Date(),
    firstReceivedAt: payload.receivedAt ?? new Date(),
    note: payload.note ?? `예정 입고 처리 (ID: ${snapshot.id}, ${actualQty}/${plannedQty})`,
    barcode: randomBarcode, // 랜덤 바코드 사용
    printLabel: true, // 입고 시 항상 라벨 프린트
    labelSize: payload.labelSize || "large",
    labelQuantity: payload.labelQuantity || 1,
  };

  let inventory;
  let labelPrintResult = null;
  try {
    const receiveResult = await inventoryTransactionService.receiveTransaction(
      receivePayload,
      userId
    );
    inventory = receiveResult.inventory;
    
    // 라벨 프린트 결과 저장
    if (receiveResult.labelInfo) {
      labelPrintResult = receiveResult.labelInfo;
    }
  } catch (err) {
    // 4) 실패 시 보상 업데이트(되돌리기) — 또다시 짧은 트랜잭션
    await sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
      async (t) => {
        // 원본 예정건 수량/상태 되돌리기
        await PlannedTransaction.update(
          {
            quantity: Sequelize.literal(`quantity + ${actualQty}`),
            status: Sequelize.literal(
              `CASE WHEN quantity + ${actualQty} > 0 THEN 'PENDING' ELSE status END`
            ),
            completed_by_user_id: Sequelize.literal(
              `CASE WHEN quantity + ${actualQty} > 0 THEN NULL ELSE completed_by_user_id END`
            ),
            completed_at: Sequelize.literal(
              `CASE WHEN quantity + ${actualQty} > 0 THEN NULL ELSE completed_at END`
            ),
            updated_at: new Date(),
          },
          { where: { id }, transaction: t }
        );

        // 부분 입고 완료 레코드가 만들어졌다면 제거
        if (completedPartial?.id) {
          await PlannedTransaction.destroy({
            where: { id: completedPartial.id },
            transaction: t,
          });
        }
      }
    );
    throw err; // 컨트롤러에서 에러 처리
  }

  // 5) 응답 구성
  const remaining = Number((await PlannedTransaction.findByPk(id)).quantity);
  return {
    planned: await PlannedTransaction.findByPk(id),
    completedPartial: completedPartial ?? null,
    inventory,
    barcode: randomBarcode,
    labelPrint: labelPrintResult,
    message:
      remaining === 0
        ? `입고가 완료되었습니다. 재고 ID: ${inventory.id}, 바코드: ${randomBarcode}`
        : `부분 입고 처리됨 (${actualQty}${snapshot.unit}). 남은 예정 수량: ${remaining}${snapshot.unit}, 바코드: ${randomBarcode}`,
  };
};

/* ===============================
 * 🔹 예정 출고 → 실제 출고 처리
 * =============================== */
exports.completePlannedIssue = async (id, payload, userId) => {
  // 0) 입력 수량 검증
  const actualQty = parseQty(payload.actualQuantity);
  if (!Number.isFinite(actualQty) || actualQty <= 0) {
    throw new Error('실제 출고 수량이 올바르지 않습니다');
  }

  // 1) 예정 트랜잭션 조회
  const planned = await PlannedTransaction.findByPk(id, {
    include: [{ model: Items }],
  });

  if (!planned) {
    throw new Error("예정 트랜잭션을 찾을 수 없습니다");
  }

  if (planned.transaction_type !== "ISSUE") {
    throw new Error("출고 예정 항목만 출고 처리할 수 있습니다");
  }

  const plannedQty = Number(planned.quantity);
  if (actualQty > plannedQty) {
    throw new Error("예정 출고 수량보다 실제 출고 수량이 많습니다");
  }

  // 2) 이동 타입 확인 (공장간 이동 / 창고간 이동 / 고객 또는 B2B 배송)
  const transferType = payload.transferType || "CUSTOMER"; // 기본값: 고객 배송
  const item = planned.Item;
  const isFinished = item && item.category === "Finished";

  // 3) 출고 처리
  const issuePayload = {
    itemId: planned.item_id,
    factoryId: planned.factory_id,
    quantity: actualQty,
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

  // 4) 라벨 프린트 처리
  let labelPrintResult = null;
  
  // 공장간 이동, 창고간 이동: 라벨 프린트 없음
  if (transferType === "FACTORY_TRANSFER" || transferType === "WAREHOUSE_TRANSFER") {
    // 라벨 프린트 없음
  } 
  // 완제품이거나 고객 배송: 라벨 프린트
  else if (isFinished || transferType === "CUSTOMER" || transferType === "B2B") {
    try {
      const labelPrintService = require("./labelPrintService");
      const { generateLabelBarcode } = require("../utils/labelBarcodeGenerator");
      
      // 출고된 재고의 바코드 사용 (첫 번째 trace의 바코드)
      const barcode = issueResult.traces && issueResult.traces.length > 0 
        ? issueResult.traces[0].barcode 
        : null;
      
      if (barcode) {
        // 라벨 프린트 데이터 준비
        const labelData = {
          barcode: generateLabelBarcode(barcode),
          productName: item.name,
          registrationNumber: item.code,
          manufactureDate: dayjs().format("YYYY-MM-DD"),
          expiryDate: dayjs().add(item.expiration_date || 365, "day").format("YYYY-MM-DD"),
          quantity: actualQty,
          unit: planned.unit,
        };

        const printParams = {
          templateType: payload.labelSize || "large",
          templateData: labelData,
          printerName: payload.printerName || null,
          printCount: payload.labelQuantity || 1,
        };

        labelPrintResult = await labelPrintService.printLabel(printParams);
      }
    } catch (labelError) {
      console.error("라벨 프린트 실패:", labelError);
      // 라벨 프린트 실패해도 출고는 완료 처리
      labelPrintResult = {
        success: false,
        message: `라벨 프린트 실패: ${labelError.message}`,
      };
    }
  }

  // 5) 예정 트랜잭션 완료 처리
  const remaining = plannedQty - actualQty;
  
  if (remaining === 0) {
    await planned.update({
      status: "COMPLETED",
      completed_by_user_id: userId || "system",
      completed_at: new Date(),
    });
  } else {
    // 부분 출고: 완료된 부분 출고 내역을 별도로 저장
    const completedPartial = await PlannedTransaction.create({
      transaction_type: "ISSUE",
      item_id: planned.item_id,
      factory_id: planned.factory_id,
      quantity: actualQty, // 완료된 수량
      unit: planned.unit,
      status: "COMPLETED", // 완료 상태로 저장
      scheduled_date: planned.scheduled_date,
      requested_by_user_id: planned.requested_by_user_id,
      completed_by_user_id: userId || "system",
      completed_at: new Date(),
      customer_name: planned.customer_name,
      issue_type: planned.issue_type,
      shipping_address: planned.shipping_address,
      notes: `부분 출고 완료 (원본 ID: ${planned.id}, ${actualQty}/${plannedQty})`,
    });

    // 원본 예정 트랜잭션은 남은 수량으로 업데이트 (PENDING 상태 유지)
    await planned.update({
      status: "PENDING",
      quantity: remaining,
      updated_at: new Date(),
    });

    return {
      planned, // 갱신된 원본 인스턴스 (남은 수량)
      completedPartial, // 완료된 부분 출고 내역
      issued: issueResult.issued,
      traces: issueResult.traces,
      labelPrint: labelPrintResult,
      message: `부분 출고 처리됨 (${actualQty}${planned.unit}). 완료 내역 저장됨. 남은 예정 수량: ${remaining}${planned.unit}`,
    };
  }

  return {
    planned, // 갱신된 인스턴스
    issued: issueResult.issued,
    traces: issueResult.traces,
    labelPrint: labelPrintResult,
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

