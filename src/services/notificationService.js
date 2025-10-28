/**
 * 알림 서비스
 * - 재고 부족 알림
 * - 유통기한 임박 알림
 * - 긴급 알림
 */

const db = require("../../models");
const { Inventories, Items, Factory } = db;
const { Op, fn, col } = require("sequelize");
const dayjs = require("dayjs");

/**
 * 재고 부족 항목 확인
 */
exports.checkLowStock = async (factoryId = null) => {
  const where = {};
  if (factoryId) where.factory_id = factoryId;

  // 품목별 총 재고 계산
  const inventoryGroups = await Inventories.findAll({
    attributes: [
      "item_id",
      "factory_id",
      [fn("SUM", col("quantity")), "totalQuantity"],
    ],
    where,
    group: ["item_id", "factory_id"],
    include: [
      {
        model: Items,
        attributes: ["id", "code", "name", "shortage", "unit", "category"],
      },
      {
        model: Factory,
        attributes: ["id", "name"],
      },
    ],
  });

  const lowStockItems = [];

  for (const group of inventoryGroups) {
    const totalQty = Number(group.get("totalQuantity"));
    const shortage = Number(group.Item?.shortage ?? 0);

    if (shortage > 0 && totalQty < shortage) {
      lowStockItems.push({
        itemId: group.item_id,
        itemCode: group.Item?.code,
        itemName: group.Item?.name,
        category: group.Item?.category,
        currentQuantity: totalQty,
        minimumQuantity: shortage,
        shortfall: shortage - totalQty,
        unit: group.Item?.unit,
        factory: {
          id: group.Factory?.id,
          name: group.Factory?.name,
        },
        severity: totalQty === 0 ? "critical" : totalQty < shortage * 0.5 ? "high" : "medium",
      });
    }
  }

  return lowStockItems;
};

/**
 * 유통기한 임박 항목 확인
 */
exports.checkExpiringItems = async (daysThreshold = 3, factoryId = null) => {
  const where = {
    quantity: { [Op.gt]: 0 },
    expiration_date: {
      [Op.between]: [
        dayjs().format("YYYY-MM-DD"),
        dayjs().add(daysThreshold, "day").format("YYYY-MM-DD"),
      ],
    },
  };

  if (factoryId) where.factory_id = factoryId;

  const expiringItems = await Inventories.findAll({
    where,
    include: [
      {
        model: Items,
        attributes: ["id", "code", "name", "category", "unit"],
      },
      {
        model: Factory,
        attributes: ["id", "name"],
      },
    ],
    order: [["expiration_date", "ASC"]],
  });

  return expiringItems.map((inv) => {
    const daysLeft = dayjs(inv.expiration_date).diff(dayjs(), "day");
    return {
      inventoryId: inv.id,
      lotNumber: inv.lot_number,
      itemCode: inv.Item?.code,
      itemName: inv.Item?.name,
      category: inv.Item?.category,
      quantity: Number(inv.quantity),
      unit: inv.unit,
      expirationDate: inv.expiration_date,
      daysLeft,
      factory: {
        id: inv.Factory?.id,
        name: inv.Factory?.name,
      },
      severity: daysLeft <= 0 ? "critical" : daysLeft === 1 ? "high" : "medium",
    };
  });
};

/**
 * 만료된 항목 확인
 */
exports.checkExpiredItems = async (factoryId = null) => {
  const where = {
    quantity: { [Op.gt]: 0 },
    expiration_date: {
      [Op.lt]: dayjs().format("YYYY-MM-DD"),
    },
  };

  if (factoryId) where.factory_id = factoryId;

  const expiredItems = await Inventories.findAll({
    where,
    include: [
      {
        model: Items,
        attributes: ["id", "code", "name", "category", "unit"],
      },
      {
        model: Factory,
        attributes: ["id", "name"],
      },
    ],
    order: [["expiration_date", "ASC"]],
  });

  return expiredItems.map((inv) => ({
    inventoryId: inv.id,
    lotNumber: inv.lot_number,
    itemCode: inv.Item?.code,
    itemName: inv.Item?.name,
    category: inv.Item?.category,
    quantity: Number(inv.quantity),
    unit: inv.unit,
    expirationDate: inv.expiration_date,
    daysExpired: Math.abs(dayjs(inv.expiration_date).diff(dayjs(), "day")),
    factory: {
      id: inv.Factory?.id,
      name: inv.Factory?.name,
    },
  }));
};

/**
 * 전체 알림 요약
 */
exports.getNotificationSummary = async (factoryId = null) => {
  const [lowStock, expiring, expired] = await Promise.all([
    exports.checkLowStock(factoryId),
    exports.checkExpiringItems(3, factoryId),
    exports.checkExpiredItems(factoryId),
  ]);

  return {
    lowStock: {
      count: lowStock.length,
      critical: lowStock.filter((item) => item.severity === "critical").length,
      items: lowStock,
    },
    expiring: {
      count: expiring.length,
      critical: expiring.filter((item) => item.severity === "critical").length,
      items: expiring,
    },
    expired: {
      count: expired.length,
      items: expired,
    },
    totalAlerts: lowStock.length + expiring.length + expired.length,
    generatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
};

/**
 * 공장별 알림 확인
 */
exports.getFactoryAlerts = async () => {
  const factories = await Factory.findAll({
    attributes: ["id", "name"],
  });

  const alerts = [];

  for (const factory of factories) {
    const summary = await exports.getNotificationSummary(factory.id);
    
    if (summary.totalAlerts > 0) {
      alerts.push({
        factory: {
          id: factory.id,
          name: factory.name,
        },
        alerts: summary,
      });
    }
  }

  return alerts;
};

/**
 * 이메일 알림 전송 (실제 구현은 SMTP 설정 필요)
 */
exports.sendEmailNotification = async (recipients, subject, body) => {
  // TODO: 실제 이메일 전송 로직 구현
  // nodemailer 등을 사용하여 구현 가능
  console.log("📧 이메일 알림:", {
    recipients,
    subject,
    body: body.substring(0, 100) + "...",
  });

  return {
    sent: true,
    recipients,
    timestamp: new Date(),
  };
};

/**
 * 일일 알림 리포트 생성
 */
exports.generateDailyAlertReport = async () => {
  const summary = await exports.getNotificationSummary();
  
  const report = {
    date: dayjs().format("YYYY-MM-DD"),
    summary: {
      totalAlerts: summary.totalAlerts,
      lowStock: summary.lowStock.count,
      expiring: summary.expiring.count,
      expired: summary.expired.count,
    },
    details: summary,
    recommendations: [],
  };

  // 권장 사항 생성
  if (summary.expired.count > 0) {
    report.recommendations.push({
      type: "urgent",
      message: `만료된 재고 ${summary.expired.count}건을 즉시 폐기 처리하세요.`,
    });
  }

  if (summary.expiring.count > 0) {
    report.recommendations.push({
      type: "warning",
      message: `유통기한 임박 재고 ${summary.expiring.count}건을 우선 출고하세요.`,
    });
  }

  if (summary.lowStock.critical > 0) {
    report.recommendations.push({
      type: "critical",
      message: `긴급 재고 부족 ${summary.lowStock.critical}건을 즉시 발주하세요.`,
    });
  }

  return report;
};

