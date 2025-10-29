/**
 * 배송 관리 서비스
 */
const db = require("../../models");
const { Order, ShippingBatch, Items } = db;
const excelParserService = require("./excelParserService");
const { Op } = require("sequelize");
const dayjs = require("dayjs");

/**
 * 업로드된 주문서 처리
 */
exports.processUploadedOrders = async (files, batchName, issueType) => {
  const orders = [];
  const errors = [];

  // 각 파일 파싱
  for (const file of files) {
    try {
      const parsedOrders = await excelParserService.parseOrderFile(file);
      orders.push(...parsedOrders);
    } catch (error) {
      errors.push({
        filename: file.originalname,
        error: error.message,
      });
    }
  }

  if (orders.length === 0) {
    throw new Error("파싱된 주문이 없습니다");
  }

  // 배치 생성
  const batch = await ShippingBatch.create({
    batch_number: generateBatchNumber(),
    batch_name: batchName || `주문 배치 ${dayjs().format("YYYY-MM-DD")}`,
    batch_date: new Date(),
    total_orders: orders.length,
    b2c_count: orders.filter((o) => o.issue_type === "B2C").length,
    b2b_count: orders.filter((o) => o.issue_type === "B2B").length,
    original_files: files.map((f) => ({
      originalname: f.originalname,
      filename: f.filename,
      size: f.size,
    })),
    status: "DRAFT",
  });

  // 주문 저장
  const savedOrders = await Order.bulkCreate(
    orders.map((order) => ({
      ...order,
      batch_id: batch.id,
      issue_type: issueType,
    }))
  );

  // 플랫폼별 통계
  const platformStats = {};
  orders.forEach((order) => {
    platformStats[order.platform] = (platformStats[order.platform] || 0) + 1;
  });

  return {
    batchId: batch.id,
    batchNumber: batch.batch_number,
    summary: {
      totalOrders: orders.length,
      byPlatform: platformStats,
      byIssueType: {
        B2C: batch.b2c_count,
        B2B: batch.b2b_count,
      },
    },
    orders: savedOrders.slice(0, 10), // 처음 10개만 반환
    errors,
  };
};

/**
 * 주문 목록 조회
 */
exports.getOrders = async (filters) => {
  const {
    batchId,
    platform,
    orderStatus,
    shippingStatus,
    issueType,
    startDate,
    endDate,
    search,
    page,
    limit,
  } = filters;

  const where = {};

  if (batchId) where.batch_id = batchId;
  if (platform) where.platform = platform;
  if (orderStatus) where.order_status = orderStatus;
  if (shippingStatus) where.shipping_status = shippingStatus;
  if (issueType) where.issue_type = issueType;

  if (startDate || endDate) {
    where.order_date = {};
    if (startDate) where.order_date[Op.gte] = new Date(startDate);
    if (endDate) where.order_date[Op.lte] = new Date(endDate);
  }

  if (search) {
    where[Op.or] = [
      { platform_order_number: { [Op.like]: `%${search}%` } },
      { recipient_name: { [Op.like]: `%${search}%` } },
      { product_name: { [Op.like]: `%${search}%` } },
    ];
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [
      {
        model: ShippingBatch,
        as: "batch",
        attributes: ["id", "batch_number", "batch_name"],
      },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });

  return {
    rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

/**
 * 주문 상세 조회
 */
exports.getOrderById = async (id) => {
  const order = await Order.findByPk(id, {
    include: [
      {
        model: ShippingBatch,
        as: "batch",
      },
      {
        model: Items,
        as: "product",
      },
    ],
  });

  return order;
};

/**
 * 주문 수정
 */
exports.updateOrder = async (id, updateData) => {
  const order = await Order.findByPk(id);

  if (!order) {
    throw new Error("주문을 찾을 수 없습니다");
  }

  await order.update(updateData);

  return order;
};

/**
 * 주문 삭제
 */
exports.deleteOrder = async (id) => {
  const order = await Order.findByPk(id);

  if (!order) {
    throw new Error("주문을 찾을 수 없습니다");
  }

  // 배치 통계 업데이트
  if (order.batch_id) {
    await updateBatchStats(order.batch_id);
  }

  await order.destroy();
};

/**
 * 출고 리스트 자동 생성
 */
exports.generateIssueList = async ({ batchId, issueType, issueDate }) => {
  const where = {};

  if (batchId) where.batch_id = batchId;
  if (issueType && issueType !== "ALL") where.issue_type = issueType;

  const orders = await Order.findAll({
    where,
    include: [
      {
        model: Items,
        as: "product",
      },
    ],
  });

  // 상품별로 그룹화
  const itemGroups = {};

  orders.forEach((order) => {
    const key = order.product_code;

    if (!itemGroups[key]) {
      itemGroups[key] = {
        itemId: order.product?.id,
        itemCode: order.product_code,
        itemName: order.product_name,
        totalQuantity: 0,
        orders: [],
      };
    }

    itemGroups[key].totalQuantity += order.quantity;
    itemGroups[key].orders.push({
      orderId: order.id,
      quantity: order.quantity,
      recipient: order.recipient_name,
    });
  });

  const items = Object.values(itemGroups);

  return {
    issueDate: issueDate || dayjs().format("YYYY-MM-DD"),
    orderCount: orders.length,
    itemCount: items.length,
    items,
  };
};

/**
 * 출고 처리 (재고 연동)
 */
exports.processIssue = async ({ issueListId, factoryId, note, actorName }) => {
  // 출고 리스트의 주문들을 조회
  const orders = await Order.findAll({
    where: { batch_id: issueListId },
  });

  const results = [];

  for (const order of orders) {
    try {
      // 재고 차감 로직 (InventoryMovement 생성)
      await db.InventoryMovement.create({
        type: "ISSUE",
        item_id: order.product_code,
        quantity: order.quantity,
        unit: "EA",
        to_factory_id: factoryId,
        note: note || `주문 출고: ${order.platform_order_number}`,
        actor_name: actorName,
        occurred_at: new Date(),
      });

      // 주문 상태 업데이트
      await order.update({
        order_status: "PREPARING",
        shipping_status: "READY",
        issued_at: new Date(),
        issued_by: actorName,
      });

      results.push({
        orderId: order.id,
        success: true,
      });
    } catch (error) {
      results.push({
        orderId: order.id,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * 송장 번호 일괄 등록
 */
exports.bulkUpdateTrackingNumbers = async ({
  orderIds,
  trackingNumbers,
  shippingCompany,
}) => {
  const results = [];

  for (let i = 0; i < orderIds.length; i++) {
    try {
      const order = await Order.findByPk(orderIds[i]);

      if (order) {
        await order.update({
          tracking_number: trackingNumbers[i],
          shipping_company: shippingCompany,
          shipping_status: "SHIPPED",
        });

        results.push({
          orderId: orderIds[i],
          trackingNumber: trackingNumbers[i],
          success: true,
        });
      }
    } catch (error) {
      results.push({
        orderId: orderIds[i],
        success: false,
        error: error.message,
      });
    }
  }

  return {
    totalProcessed: results.length,
    successCount: results.filter((r) => r.success).length,
    failCount: results.filter((r) => !r.success).length,
    results,
  };
};

/**
 * 송장 번호 엑셀 업로드
 */
exports.uploadTrackingNumbers = async (file) => {
  const trackingData = await excelParserService.parseTrackingNumberFile(file);

  return await this.bulkUpdateTrackingNumbers({
    orderIds: trackingData.map((d) => d.orderId),
    trackingNumbers: trackingData.map((d) => d.trackingNumber),
    shippingCompany: trackingData[0]?.shippingCompany,
  });
};

/**
 * 배치 목록 조회
 */
exports.getBatches = async ({ status, startDate, endDate, page, limit }) => {
  const where = {};

  if (status) where.status = status;

  if (startDate || endDate) {
    where.batch_date = {};
    if (startDate) where.batch_date[Op.gte] = new Date(startDate);
    if (endDate) where.batch_date[Op.lte] = new Date(endDate);
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await ShippingBatch.findAndCountAll({
    where,
    include: [
      {
        model: Order,
        as: "orders",
        attributes: ["id"],
      },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });

  return {
    rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

/**
 * 배치 상세 조회
 */
exports.getBatchById = async (id) => {
  const batch = await ShippingBatch.findByPk(id, {
    include: [
      {
        model: Order,
        as: "orders",
      },
    ],
  });

  return batch;
};

/**
 * 배치 확정
 */
exports.confirmBatch = async (id, confirmedBy) => {
  const batch = await ShippingBatch.findByPk(id);

  if (!batch) {
    throw new Error("배치를 찾을 수 없습니다");
  }

  await batch.update({
    status: "CONFIRMED",
    confirmed_by: confirmedBy,
    confirmed_at: new Date(),
  });

  return batch;
};

/**
 * 배치 삭제
 */
exports.deleteBatch = async (id) => {
  const batch = await ShippingBatch.findByPk(id);

  if (!batch) {
    throw new Error("배치를 찾을 수 없습니다");
  }

  // 관련 주문도 삭제
  await Order.destroy({ where: { batch_id: id } });

  await batch.destroy();
};

/* ===============================
 * 유틸리티 함수
 * =============================== */

/**
 * 배치 번호 생성
 */
function generateBatchNumber() {
  const date = dayjs().format("YYYYMMDD");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `SHIP-${date}-${random}`;
}

/**
 * 배치 통계 업데이트
 */
async function updateBatchStats(batchId) {
  const orders = await Order.findAll({
    where: { batch_id: batchId },
  });

  await ShippingBatch.update(
    {
      total_orders: orders.length,
      b2c_count: orders.filter((o) => o.issue_type === "B2C").length,
      b2b_count: orders.filter((o) => o.issue_type === "B2B").length,
    },
    {
      where: { id: batchId },
    }
  );
}

