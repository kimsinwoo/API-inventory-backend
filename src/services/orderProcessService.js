const db = require("../../models");
const { Inventories, Items, InventoryMovement, sequelize } = db;
const { Op, fn, col } = require("sequelize");
const dayjs = require("dayjs");
const xlsx = require("xlsx");

async function fifoIssue({ itemId, factoryId, quantity, t }) {
  let remain = Number(quantity);
  if (remain <= 0) return { issued: 0, traces: [] };

  const lots = await Inventories.findAll({
    where: { item_id: itemId, factory_id: factoryId, quantity: { [Op.gt]: 0 } },
    order: [["received_at", "ASC"], ["id", "ASC"]],
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  const traces = [];
  let issued = 0;

  for (const lot of lots) {
    if (remain <= 0) break;
    const take = Math.min(Number(lot.quantity), remain);
    if (take > 0) {
      await lot.update({ quantity: Number(lot.quantity) - take }, { transaction: t });
      traces.push({ lotNumber: lot.lot_number, take });
      issued += take;
      remain -= take;
    }
  }

  if (remain > 1e-9) throw new Error(`재고가 부족합니다. (부족: ${remain})`);
  return { issued, traces };
}

function parseExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath, {
    type: "file",
    codepage: 65001,
    raw: false,
  });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const nonEmptyRows = data.filter((row) => row.some((cell) => cell !== ""));

  if (nonEmptyRows.length === 0) {
    throw new Error("Excel 파일이 비어있습니다");
  }

  let headerRowIndex = 0;
  for (let i = 0; i < nonEmptyRows.length; i++) {
    const row = nonEmptyRows[i];
    if (row.some((cell) => cell && cell.toString().trim() !== "")) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = nonEmptyRows[headerRowIndex].map((h) =>
    h ? h.toString().trim().toLowerCase() : ""
  );

  const mapping = {};
  headers.forEach((header, index) => {
    const h = header.toLowerCase();
    if (h.includes("품목코드") || h.includes("상품코드") || h.includes("품번")) {
      mapping.itemCode = index;
    }
    if (h.includes("품목명") || h.includes("상품명") || h.includes("제품명")) {
      mapping.itemName = index;
    }
    if (h.includes("수량")) {
      mapping.quantity = index;
    }
    if (h.includes("주문번호") || h.includes("주문id")) {
      mapping.orderNum = index;
    }
    if (h.includes("주문일") || h.includes("주문날짜")) {
      mapping.orderDate = index;
    }
    if (h.includes("수취인") || h.includes("구매자")) {
      mapping.recipient = index;
    }
    if (h.includes("주소") || h.includes("배송지")) {
      mapping.address = index;
    }
  });

  console.log("감지된 컬럼 매핑:", mapping);

  if (mapping.quantity === undefined || (mapping.itemCode === undefined && mapping.itemName === undefined)) {
    throw new Error(
      "필수 컬럼을 찾을 수 없습니다. 수량, 품목코드 또는 품목명 컬럼이 필요합니다."
    );
  }

  const orders = [];
  const startRow = headerRowIndex + 1;

  for (let i = startRow; i < nonEmptyRows.length; i++) {
    const row = nonEmptyRows[i];

    if (!row || row.every((cell) => !cell || cell === "")) {
      continue;
    }

    const order = {
      itemCode: mapping.itemCode !== undefined ? cleanText(row[mapping.itemCode]) : "",
      itemName: mapping.itemName !== undefined ? cleanText(row[mapping.itemName]) : "",
      quantity: mapping.quantity !== undefined ? parseNumber(row[mapping.quantity]) : 0,
      orderNum: mapping.orderNum !== undefined ? cleanText(row[mapping.orderNum]) : "",
      orderDate: mapping.orderDate !== undefined ? cleanText(row[mapping.orderDate]) : "",
      recipient: mapping.recipient !== undefined ? cleanText(row[mapping.recipient]) : "",
      address: mapping.address !== undefined ? cleanText(row[mapping.address]) : "",
    };

    if ((order.itemCode || order.itemName) && order.quantity > 0) {
      orders.push(order);
    }
  }

  console.log(`추출된 주문 수: ${orders.length}`);
  return orders;
}

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return value.toString().trim();
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;

  const numStr = value.toString().replace(/[^\d.-]/g, "");
  const num = parseFloat(numStr);

  return isNaN(num) ? 0 : num;
}

async function findItemByCodeOrName(itemCode, itemName) {
  const where = {};

  if (itemCode) {
    where.code = { [Op.like]: `%${itemCode}%` };
  } else if (itemName) {
    where.name = { [Op.like]: `%${itemName}%` };
  } else {
    return null;
  }

  const item = await Items.findOne({ where });
  return item;
}

exports.processOrderFile = async (filePath, factoryId, userId = null) => {
  console.log("\n========================================");
  console.log("📦 주문서 처리 시작");
  console.log("========================================");

  const orders = parseExcelFile(filePath);

  if (orders.length === 0) {
    throw new Error("처리할 주문이 없습니다");
  }

  console.log(`\n총 ${orders.length}건 주문 처리 중...\n`);

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    console.log(`\n[${i + 1}/${orders.length}] 처리 중...`);
    console.log(`  품목코드: ${order.itemCode || "-"}`);
    console.log(`  품목명: ${order.itemName || "-"}`);
    console.log(`  수량: ${order.quantity}`);

    try {
      const item = await findItemByCodeOrName(order.itemCode, order.itemName);

      if (!item) {
        throw new Error(`품목을 찾을 수 없습니다: ${order.itemCode || order.itemName}`);
      }

      console.log(`  ✓ 품목 확인: [${item.code}] ${item.name}`);

      const currentStock = await Inventories.findOne({
        attributes: [[fn("SUM", col("quantity")), "totalQty"]],
        where: {
          item_id: item.id,
          factory_id: factoryId,
          quantity: { [Op.gt]: 0 },
        },
        raw: true,
      });

      const totalQty = Number(currentStock?.totalQty ?? 0);
      console.log(`  현재 재고: ${totalQty} ${item.unit}`);

      if (totalQty < order.quantity) {
        throw new Error(
          `재고 부족: 현재 ${totalQty} ${item.unit}, 필요 ${order.quantity} ${item.unit}`
        );
      }

      const result = await sequelize.transaction(async (t) => {
        const { issued, traces } = await fifoIssue({
          itemId: item.id,
          factoryId: factoryId,
          quantity: order.quantity,
          t,
        });

        for (const tr of traces) {
          await InventoryMovement.create(
            {
              type: "ISSUE",
              item_id: item.id,
              lot_number: tr.lotNumber,
              quantity: tr.take,
              unit: item.unit,
              from_factory_id: factoryId,
              to_factory_id: null,
              note: `주문서 출고: ${order.orderNum || "주문번호 없음"}`,
              actor_name: order.recipient || null,
              occurred_at: new Date(),
            },
            { transaction: t }
          );
        }

        return { issued, traces };
      });

      console.log(`  ✓ 출고 완료: ${result.issued} ${item.unit}`);
      
      results.push({
        success: true,
        itemCode: item.code,
        itemName: item.name,
        requestedQuantity: order.quantity,
        issuedQuantity: result.issued,
        unit: item.unit,
        orderNum: order.orderNum,
        recipient: order.recipient,
        traces: result.traces,
      });

      successCount++;
    } catch (error) {
      console.error(`  ✗ 실패: ${error.message}`);

      results.push({
        success: false,
        itemCode: order.itemCode,
        itemName: order.itemName,
        requestedQuantity: order.quantity,
        orderNum: order.orderNum,
        recipient: order.recipient,
        error: error.message,
      });

      failCount++;
    }
  }

  console.log("\n========================================");
  console.log("📊 처리 결과");
  console.log("========================================");
  console.log(`총 주문: ${orders.length}건`);
  console.log(`성공: ${successCount}건`);
  console.log(`실패: ${failCount}건`);
  console.log("========================================\n");

  return {
    total: orders.length,
    success: successCount,
    failed: failCount,
    results,
    processedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
};

exports.processOrderData = async (orders, factoryId, userId = null) => {
  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const order of orders) {
    try {
      const item = await findItemByCodeOrName(order.itemCode, order.itemName);

      if (!item) {
        throw new Error(`품목을 찾을 수 없습니다`);
      }

      const result = await sequelize.transaction(async (t) => {
        const { issued, traces } = await fifoIssue({
          itemId: item.id,
          factoryId: factoryId,
          quantity: order.quantity,
          t,
        });

        for (const tr of traces) {
          await InventoryMovement.create(
            {
              type: "ISSUE",
              item_id: item.id,
              lot_number: tr.lotNumber,
              quantity: tr.take,
              unit: item.unit,
              from_factory_id: factoryId,
              to_factory_id: null,
              note: `주문서 출고: ${order.orderNum || "주문번호 없음"}`,
              actor_name: order.recipient || null,
              occurred_at: new Date(),
            },
            { transaction: t }
          );
        }

        return { issued, traces };
      });

      results.push({
        success: true,
        itemCode: item.code,
        itemName: item.name,
        requestedQuantity: order.quantity,
        issuedQuantity: result.issued,
        unit: item.unit,
        traces: result.traces,
      });

      successCount++;
    } catch (error) {
      results.push({
        success: false,
        itemCode: order.itemCode,
        itemName: order.itemName,
        requestedQuantity: order.quantity,
        error: error.message,
      });

      failCount++;
    }
  }

  return {
    total: orders.length,
    success: successCount,
    failed: failCount,
    results,
  };
};


