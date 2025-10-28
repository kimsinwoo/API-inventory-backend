/**
 * 리포트 생성 서비스
 * - 일일/주간/월간 리포트
 * - Excel 리포트 생성
 * - 재고 분석 리포트
 */

const db = require("../../models");
const { Inventories, Items, Factory, InventoryMovement } = db;
const { Op, fn, col } = require("sequelize");
const dayjs = require("dayjs");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

/**
 * 일일 리포트 생성
 */
exports.generateDailyReport = async (date = null, factoryId = null) => {
  const reportDate = date ? dayjs(date) : dayjs();
  const startOfDay = reportDate.startOf("day").toDate();
  const endOfDay = reportDate.endOf("day").toDate();

  const where = {
    occurred_at: {
      [Op.between]: [startOfDay, endOfDay],
    },
  };

  if (factoryId) {
    where[Op.or] = [
      { from_factory_id: factoryId },
      { to_factory_id: factoryId },
    ];
  }

  // 일일 트랜잭션 요약
  const transactions = await InventoryMovement.findAll({
    attributes: [
      "type",
      [fn("COUNT", col("id")), "count"],
      [fn("SUM", col("quantity")), "totalQuantity"],
    ],
    where,
    group: ["type"],
    raw: true,
  });

  // 트랜잭션 상세 내역
  const details = await InventoryMovement.findAll({
    where,
    include: [
      {
        model: Items,
        attributes: ["code", "name", "category"],
      },
      {
        model: Factory,
        as: "fromFactory",
        attributes: ["name"],
      },
      {
        model: Factory,
        as: "toFactory",
        attributes: ["name"],
      },
    ],
    order: [["occurred_at", "DESC"]],
  });

  const typeLabels = {
    RECEIVE: "입고",
    ISSUE: "출고",
    TRANSFER_OUT: "이동(출)",
    TRANSFER_IN: "이동(입)",
  };

  const summary = {
    receive: { count: 0, quantity: 0 },
    issue: { count: 0, quantity: 0 },
    transfer: { count: 0, quantity: 0 },
  };

  for (const tx of transactions) {
    const count = Number(tx.count);
    const quantity = Number(tx.totalQuantity);

    if (tx.type === "RECEIVE") {
      summary.receive = { count, quantity };
    } else if (tx.type === "ISSUE") {
      summary.issue = { count, quantity };
    } else {
      summary.transfer.count += count;
      summary.transfer.quantity += quantity;
    }
  }

  return {
    reportDate: reportDate.format("YYYY-MM-DD"),
    summary,
    details: details.map((d) => ({
      time: dayjs(d.occurred_at).format("HH:mm:ss"),
      type: typeLabels[d.type] || d.type,
      itemCode: d.Item?.code,
      itemName: d.Item?.name,
      quantity: Number(d.quantity),
      unit: d.unit,
      from: d.fromFactory?.name || "-",
      to: d.toFactory?.name || "-",
      actor: d.actor_name || "시스템",
      note: d.note || "-",
    })),
    generatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
};

/**
 * 주간 리포트 생성
 */
exports.generateWeeklyReport = async (weekStart = null, factoryId = null) => {
  const startDate = weekStart
    ? dayjs(weekStart).startOf("week")
    : dayjs().startOf("week");
  const endDate = startDate.endOf("week");

  const where = {
    occurred_at: {
      [Op.between]: [startDate.toDate(), endDate.toDate()],
    },
  };

  if (factoryId) {
    where[Op.or] = [
      { from_factory_id: factoryId },
      { to_factory_id: factoryId },
    ];
  }

  // 일별 트랜잭션
  const dailyTransactions = await InventoryMovement.findAll({
    attributes: [
      [fn("DATE", col("occurred_at")), "date"],
      "type",
      [fn("COUNT", col("id")), "count"],
      [fn("SUM", col("quantity")), "totalQuantity"],
    ],
    where,
    group: [fn("DATE", col("occurred_at")), "type"],
    order: [[fn("DATE", col("occurred_at")), "ASC"]],
    raw: true,
  });

  // 주간 상위 품목
  const topItems = await InventoryMovement.findAll({
    attributes: [
      "item_id",
      [fn("SUM", col("quantity")), "totalQuantity"],
      [fn("COUNT", col("id")), "transactionCount"],
    ],
    where,
    include: [
      {
        model: Items,
        attributes: ["code", "name", "category"],
      },
    ],
    group: ["item_id"],
    order: [[fn("SUM", col("quantity")), "DESC"]],
    limit: 10,
    subQuery: false,
  });

  // 일별 데이터 구조화
  const dailyData = [];
  for (let i = 0; i < 7; i++) {
    const date = startDate.add(i, "day");
    dailyData.push({
      date: date.format("YYYY-MM-DD"),
      dayOfWeek: date.format("ddd"),
      receive: 0,
      issue: 0,
      transfer: 0,
    });
  }

  for (const tx of dailyTransactions) {
    const dateStr = tx.date;
    const dayData = dailyData.find((d) => d.date === dateStr);
    if (dayData) {
      const qty = Number(tx.totalQuantity);
      if (tx.type === "RECEIVE") dayData.receive += qty;
      else if (tx.type === "ISSUE") dayData.issue += qty;
      else dayData.transfer += qty;
    }
  }

  return {
    weekStart: startDate.format("YYYY-MM-DD"),
    weekEnd: endDate.format("YYYY-MM-DD"),
    dailyData,
    topItems: topItems.map((item) => ({
      itemCode: item.Item?.code,
      itemName: item.Item?.name,
      category: item.Item?.category,
      totalQuantity: Number(item.get("totalQuantity")),
      transactionCount: Number(item.get("transactionCount")),
    })),
    generatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
};

/**
 * 월간 리포트 생성
 */
exports.generateMonthlyReport = async (year = null, month = null, factoryId = null) => {
  const reportDate = year && month ? dayjs(`${year}-${month}-01`) : dayjs();
  const startOfMonth = reportDate.startOf("month");
  const endOfMonth = reportDate.endOf("month");

  const where = {
    occurred_at: {
      [Op.between]: [startOfMonth.toDate(), endOfMonth.toDate()],
    },
  };

  if (factoryId) {
    where[Op.or] = [
      { from_factory_id: factoryId },
      { to_factory_id: factoryId },
    ];
  }

  // 월간 통계
  const [transactions, categoryStats, factoryStats] = await Promise.all([
    InventoryMovement.findAll({
      attributes: [
        "type",
        [fn("COUNT", col("id")), "count"],
        [fn("SUM", col("quantity")), "totalQuantity"],
      ],
      where,
      group: ["type"],
      raw: true,
    }),
    InventoryMovement.findAll({
      attributes: [
        [fn("SUM", col("quantity")), "totalQuantity"],
        [fn("COUNT", col("id")), "transactionCount"],
      ],
      where,
      include: [
        {
          model: Items,
          attributes: ["category"],
        },
      ],
      group: ["Item.category"],
      raw: true,
    }),
    factoryId
      ? []
      : InventoryMovement.findAll({
          attributes: [
            "from_factory_id",
            "to_factory_id",
            [fn("COUNT", col("id")), "count"],
          ],
          where,
          group: ["from_factory_id", "to_factory_id"],
          raw: true,
        }),
  ]);

  const summary = {
    receive: { count: 0, quantity: 0 },
    issue: { count: 0, quantity: 0 },
    transfer: { count: 0, quantity: 0 },
  };

  for (const tx of transactions) {
    const count = Number(tx.count);
    const quantity = Number(tx.totalQuantity);

    if (tx.type === "RECEIVE") {
      summary.receive = { count, quantity };
    } else if (tx.type === "ISSUE") {
      summary.issue = { count, quantity };
    } else {
      summary.transfer.count += count;
      summary.transfer.quantity += quantity;
    }
  }

  return {
    year: reportDate.year(),
    month: reportDate.month() + 1,
    monthLabel: reportDate.format("YYYY년 MM월"),
    summary,
    categoryStats: categoryStats.map((stat) => ({
      category: stat["Item.category"],
      totalQuantity: Number(stat.totalQuantity),
      transactionCount: Number(stat.transactionCount),
    })),
    generatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
};

/**
 * 재고 현황 리포트
 */
exports.generateInventoryStatusReport = async (factoryId = null) => {
  const where = { quantity: { [Op.gt]: 0 } };
  if (factoryId) where.factory_id = factoryId;

  const inventories = await Inventories.findAll({
    where,
    include: [
      {
        model: Items,
        attributes: ["code", "name", "category", "unit", "shortage"],
      },
      {
        model: Factory,
        attributes: ["name"],
      },
    ],
    order: [["Item", "category"], ["Item", "name"]],
  });

  const items = inventories.map((inv) => {
    const daysLeft = dayjs(inv.expiration_date).diff(dayjs(), "day");
    const item = inv.Item;

    return {
      factory: inv.Factory?.name,
      itemCode: item?.code,
      itemName: item?.name,
      category: item?.category,
      lotNumber: inv.lot_number,
      quantity: Number(inv.quantity),
      unit: inv.unit,
      wholesalePrice: Number(inv.wholesale_price),
      totalValue: Number(inv.quantity) * Number(inv.wholesale_price),
      expirationDate: inv.expiration_date,
      daysLeft,
      status: inv.status,
      shortage: Number(item?.shortage ?? 0),
    };
  });

  // 요약 통계
  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
  const totalItems = items.length;
  const lowStockItems = items.filter((item) => item.quantity < item.shortage).length;
  const expiringItems = items.filter((item) => item.daysLeft <= 3 && item.daysLeft >= 0).length;

  return {
    summary: {
      totalValue,
      totalItems,
      lowStockItems,
      expiringItems,
    },
    items,
    generatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
};

/**
 * Excel 리포트 파일 생성
 */
exports.exportToExcel = async (reportType, data, fileName = null) => {
  const outputDir = path.join(__dirname, "../../uploads/reports");

  // 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const workbook = xlsx.utils.book_new();
  const timestamp = dayjs().format("YYYYMMDD_HHmmss");
  const finalFileName = fileName || `${reportType}_${timestamp}.xlsx`;

  // 리포트 타입별로 시트 생성
  if (reportType === "daily") {
    const summarySheet = xlsx.utils.json_to_sheet([data.summary]);
    const detailsSheet = xlsx.utils.json_to_sheet(data.details);

    xlsx.utils.book_append_sheet(workbook, summarySheet, "요약");
    xlsx.utils.book_append_sheet(workbook, detailsSheet, "상세내역");
  } else if (reportType === "weekly") {
    const dailySheet = xlsx.utils.json_to_sheet(data.dailyData);
    const topItemsSheet = xlsx.utils.json_to_sheet(data.topItems);

    xlsx.utils.book_append_sheet(workbook, dailySheet, "일별현황");
    xlsx.utils.book_append_sheet(workbook, topItemsSheet, "상위품목");
  } else if (reportType === "monthly") {
    const summarySheet = xlsx.utils.json_to_sheet([data.summary]);
    const categorySheet = xlsx.utils.json_to_sheet(data.categoryStats);

    xlsx.utils.book_append_sheet(workbook, summarySheet, "월간요약");
    xlsx.utils.book_append_sheet(workbook, categorySheet, "카테고리별통계");
  } else if (reportType === "inventory") {
    const summarySheet = xlsx.utils.json_to_sheet([data.summary]);
    const itemsSheet = xlsx.utils.json_to_sheet(data.items);

    xlsx.utils.book_append_sheet(workbook, summarySheet, "요약");
    xlsx.utils.book_append_sheet(workbook, itemsSheet, "재고현황");
  }

  const filePath = path.join(outputDir, finalFileName);
  xlsx.writeFile(workbook, filePath);

  return {
    fileName: finalFileName,
    filePath,
    size: fs.statSync(filePath).size,
    generatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
};

/**
 * 재고 회전율 분석
 */
exports.analyzeInventoryTurnover = async (factoryId = null, days = 30) => {
  const startDate = dayjs().subtract(days, "day");

  const where = { quantity: { [Op.gt]: 0 } };
  if (factoryId) where.factory_id = factoryId;

  // 현재 재고
  const currentInventory = await Inventories.findAll({
    attributes: [
      "item_id",
      [fn("SUM", col("quantity")), "totalQuantity"],
      [fn("SUM", fn("*", col("quantity"), col("wholesale_price"))), "totalValue"],
    ],
    where,
    group: ["item_id"],
    include: [
      {
        model: Items,
        attributes: ["code", "name", "category"],
      },
    ],
  });

  // 기간 내 출고량
  const issueWhere = {
    type: "ISSUE",
    occurred_at: {
      [Op.gte]: startDate.toDate(),
    },
  };

  if (factoryId) issueWhere.from_factory_id = factoryId;

  const issues = await InventoryMovement.findAll({
    attributes: [
      "item_id",
      [fn("SUM", col("quantity")), "totalIssued"],
    ],
    where: issueWhere,
    group: ["item_id"],
  });

  const issueMap = new Map(
    issues.map((issue) => [
      issue.item_id,
      Number(issue.get("totalIssued")),
    ])
  );

  const turnoverAnalysis = currentInventory.map((inv) => {
    const itemId = inv.item_id;
    const currentQty = Number(inv.get("totalQuantity"));
    const issuedQty = issueMap.get(itemId) || 0;
    const turnoverRate = currentQty > 0 ? (issuedQty / currentQty) * (365 / days) : 0;
    const daysOfStock = issuedQty > 0 ? (currentQty / issuedQty) * days : 999;

    return {
      itemCode: inv.Item?.code,
      itemName: inv.Item?.name,
      category: inv.Item?.category,
      currentQuantity: currentQty,
      issuedQuantity: issuedQty,
      turnoverRate: Math.round(turnoverRate * 100) / 100,
      daysOfStock: Math.round(daysOfStock),
      status:
        daysOfStock < 7
          ? "빠름"
          : daysOfStock < 30
          ? "보통"
          : daysOfStock < 90
          ? "느림"
          : "정체",
    };
  });

  return {
    period: `${days}일`,
    analysis: turnoverAnalysis.sort((a, b) => b.turnoverRate - a.turnoverRate),
    generatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
};

