/**
 * 생산 작업 지시서 서비스
 * - 생산 완료 시 완제품 재고 생성
 */
const db = require("../../models");
const {
  WorkOrder,
  Items,
  BOM,
  BOMComponent,
  Factory,
  Inventories,
  InventoryMovement,
  User,
  UserProfile,
  sequelize,
} = db;
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const { generateBarcode } = require("../utils/barcodeGenerator");

/**
 * 작업 지시서 번호 생성
 */
function generateWorkOrderNumber() {
  const date = dayjs().format("YYYYMMDD");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `WO-${date}-${random}`;
}

/**
 * 작업 지시서 생성
 */
exports.createWorkOrder = async (payload, userId) => {
  const {
    productItemId,
    bomId,
    factoryId,
    plannedQuantity,
    scheduledStartDate,
    scheduledEndDate,
    notes,
  } = payload;

  // 품목 확인 (완제품)
  const product = await Items.findByPk(productItemId);
  if (!product) {
    throw new Error(`완제품(ID: ${productItemId})을 찾을 수 없습니다`);
  }

  // BOM 확인
  const bom = await BOM.findByPk(bomId, {
    include: [
      {
        model: BOMComponent,
        as: "components",
        include: [{ model: Items, as: "item" }],
      },
    ],
  });

  if (!bom) {
    throw new Error(`BOM(ID: ${bomId})을 찾을 수 없습니다`);
  }

  // 공장 확인
  const factory = await Factory.findByPk(factoryId);
  if (!factory) {
    throw new Error(`공장(ID: ${factoryId})을 찾을 수 없습니다`);
  }

  // 작업 지시서 생성
  const workOrder = await WorkOrder.create({
    work_order_number: generateWorkOrderNumber(),
    product_item_id: productItemId,
    bom_id: bomId,
    factory_id: factoryId,
    planned_quantity: Number(plannedQuantity),
    unit: product.unit,
    status: "PENDING",
    scheduled_start_date: scheduledStartDate || null,
    scheduled_end_date: scheduledEndDate || null,
    created_by_user_id: userId || null,
    notes: notes || null,
  });

  return {
    workOrder: await exports.getWorkOrderById(workOrder.id),
    message: `작업 지시서 ${workOrder.work_order_number}가 생성되었습니다`,
  };
};

/**
 * 작업 지시서 목록 조회
 */
exports.listWorkOrders = async (filter = {}) => {
  const {
    status,
    factoryId,
    productItemId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = filter;

  const where = {};

  if (status) where.status = status;
  if (factoryId) where.factory_id = factoryId;
  if (productItemId) where.product_item_id = productItemId;

  if (startDate) {
    where.scheduled_start_date = { [Op.gte]: new Date(startDate) };
  }
  if (endDate) {
    where.scheduled_end_date = {
      ...(where.scheduled_end_date || {}),
      [Op.lte]: new Date(endDate),
    };
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await WorkOrder.findAndCountAll({
    where,
    include: [
      { model: Items, as: "product", attributes: ["id", "code", "name", "unit"] },
      { model: BOM, as: "bom", attributes: ["id", "name"] },
      { model: Factory, as: "factory", attributes: ["id", "name", "type"] },
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });

  return {
    items: rows,
    meta: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    },
  };
};

/**
 * 작업 지시서 상세 조회
 */
exports.getWorkOrderById = async (id) => {
  const workOrder = await WorkOrder.findByPk(id, {
    include: [
      { model: Items, as: "product", attributes: ["id", "code", "name", "unit", "category"] },
      {
        model: BOM,
        as: "bom",
        include: [
          {
            model: BOMComponent,
            as: "components",
            include: [{ model: Items, as: "item" }],
          },
        ],
      },
      { model: Factory, as: "factory", attributes: ["id", "name", "type"] },
    ],
  });

  if (!workOrder) {
    throw new Error(`작업 지시서(ID: ${id})를 찾을 수 없습니다`);
  }

  return workOrder;
};

/**
 * 작업 지시서 수정
 */
exports.updateWorkOrder = async (id, updateData) => {
  const workOrder = await WorkOrder.findByPk(id);
  if (!workOrder) {
    throw new Error(`작업 지시서(ID: ${id})를 찾을 수 없습니다`);
  }

  if (workOrder.status === "COMPLETED") {
    throw new Error("완료된 작업 지시서는 수정할 수 없습니다");
  }

  await workOrder.update(updateData);

  return {
    workOrder: await exports.getWorkOrderById(id),
    message: "작업 지시서가 수정되었습니다",
  };
};

/**
 * 작업 지시서 삭제
 */
exports.deleteWorkOrder = async (id) => {
  const workOrder = await WorkOrder.findByPk(id);
  if (!workOrder) {
    throw new Error(`작업 지시서(ID: ${id})를 찾을 수 없습니다`);
  }

  if (workOrder.status === "COMPLETED") {
    throw new Error("완료된 작업 지시서는 삭제할 수 없습니다");
  }

  await workOrder.destroy();

  return { message: "작업 지시서가 삭제되었습니다" };
};

/**
 * 작업 시작 처리
 */
exports.startWorkOrder = async (id, userId) => {
  const workOrder = await WorkOrder.findByPk(id);
  if (!workOrder) {
    throw new Error(`작업 지시서(ID: ${id})를 찾을 수 없습니다`);
  }

  if (workOrder.status !== "PENDING") {
    throw new Error("대기 중인 작업 지시서만 시작할 수 있습니다");
  }

  await workOrder.update({
    status: "IN_PROGRESS",
    actual_start_date: new Date(),
  });

  return {
    workOrder: await exports.getWorkOrderById(id),
    message: "작업이 시작되었습니다",
  };
};

/**
 * 생산 완료 처리 (원재료 소비 + 완제품 생성)
 */
exports.completeWorkOrder = async (id, payload, userId) => {
  const { actualQuantity, barcode, storageConditionId, wholesalePrice, notes } = payload;

  const workOrder = await exports.getWorkOrderById(id);

  if (workOrder.status === "COMPLETED") {
    throw new Error("이미 완료된 작업 지시서입니다");
  }

  if (workOrder.status === "CANCELLED") {
    throw new Error("취소된 작업 지시서입니다");
  }

  const product = workOrder.product;
  const bom = workOrder.bom;
  const factory = workOrder.factory;

  // 생산 수량
  const productionQty = Number(actualQuantity || workOrder.planned_quantity);

  // 사용자 정보 조회
  let actorName = "시스템";
  if (userId) {
    const user = await User.findByPk(userId, {
      include: [{ model: UserProfile, as: "UserProfile", attributes: ["full_name"] }],
    });
    if (user && user.UserProfile) {
      actorName = user.UserProfile.full_name;
    }
  }

  return sequelize.transaction(async (t) => {
    // 1. 완제품 생성 (재고 입고)
    const productBarcode = barcode || generateBarcode();
    const now = dayjs();

    const newInventory = await Inventories.create(
      {
        item_id: product.id,
        factory_id: workOrder.factory_id,
        storage_condition_id: storageConditionId || product.storage_condition_id,
        barcode: productBarcode,
        wholesale_price: wholesalePrice || product.wholesale_price || 0,
        quantity: productionQty,
        received_at: now.toDate(),
        first_received_at: now.toDate(),
        expiration_date: now.add(product.expiration_date || 365, "day").format("YYYY-MM-DD"),
        status: "Normal",
        unit: product.unit,
      },
      { transaction: t }
    );

    // 완제품 입고 이력 생성
    await InventoryMovement.create(
      {
        type: "RECEIVE",
        item_id: product.id,
        barcode: productBarcode,
        quantity: productionQty,
        unit: product.unit,
        to_factory_id: workOrder.factory_id,
        note: `작업지시서 ${workOrder.work_order_number} 생산 완료`,
        actor_name: actorName,
        occurred_at: new Date(),
      },
      { transaction: t }
    );

    // 2. 작업 지시서 완료 처리
    await workOrder.update(
      {
        status: "COMPLETED",
        actual_quantity: productionQty,
        actual_end_date: new Date(),
        completed_by_user_id: userId || null,
        notes: notes || workOrder.notes,
      },
      { transaction: t }
    );

    return {
      workOrder: await exports.getWorkOrderById(id),
      producedProduct: {
        itemId: product.id,
        itemName: product.name,
        itemCode: product.code,
        quantity: productionQty,
        unit: product.unit,
        barcode: productBarcode,
        inventoryId: newInventory.id,
      },
      message: `작업 지시서 ${workOrder.work_order_number} 생산 완료: ${product.name} ${productionQty}${product.unit} 생산됨`,
    };
  });
};

/**
 * 작업 지시서 취소
 */
exports.cancelWorkOrder = async (id, reason) => {
  const workOrder = await WorkOrder.findByPk(id);
  if (!workOrder) {
    throw new Error(`작업 지시서(ID: ${id})를 찾을 수 없습니다`);
  }

  if (workOrder.status === "COMPLETED") {
    throw new Error("완료된 작업 지시서는 취소할 수 없습니다");
  }

  await workOrder.update({
    status: "CANCELLED",
    notes: reason ? `취소 사유: ${reason}` : workOrder.notes,
  });

  return {
    workOrder: await exports.getWorkOrderById(id),
    message: "작업 지시서가 취소되었습니다",
  };
};

/**
 * 통계
 */
exports.getWorkOrderStats = async (filter = {}) => {
  const { startDate, endDate, factoryId } = filter;

  const where = {};
  if (startDate) where.created_at = { [Op.gte]: new Date(startDate) };
  if (endDate) where.created_at = { ...where.created_at, [Op.lte]: new Date(endDate) };
  if (factoryId) where.factory_id = factoryId;

  const total = await WorkOrder.count({ where });

  const byStatus = await WorkOrder.findAll({
    where,
    attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    group: ["status"],
    raw: true,
  });

  const statusStats = {};
  byStatus.forEach((s) => {
    statusStats[s.status] = parseInt(s.count);
  });

  return {
    total,
    byStatus: statusStats,
  };
};

