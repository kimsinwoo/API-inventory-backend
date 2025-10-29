const orderProcessService = require("../services/orderProcessService");
const path = require("path");

exports.processOrderFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "파일이 업로드되지 않았습니다",
      });
    }

    const factoryId = req.body.factoryId || req.query.factoryId;

    if (!factoryId) {
      return res.status(400).json({
        ok: false,
        message: "공장 ID(factoryId)가 필요합니다",
      });
    }

    const userId = req.session?.userId || null;

    console.log("\n========================================");
    console.log("📦 주문서 파일 처리 요청");
    console.log("========================================");
    console.log(`파일명: ${req.file.originalname}`);
    console.log(`공장 ID: ${factoryId}`);
    console.log(`처리자: ${userId || "Anonymous"}`);
    console.log("========================================\n");

    const result = await orderProcessService.processOrderFile(
      req.file.path,
      parseInt(factoryId),
      userId
    );

    const statusCode = result.failed > 0 ? 207 : 200;

    res.status(statusCode).json({
      ok: result.failed === 0,
      message:
        result.failed === 0
          ? `${result.success}건의 주문이 성공적으로 처리되었습니다`
          : `${result.success}건 성공, ${result.failed}건 실패`,
      data: result,
    });
  } catch (error) {
    console.error("주문서 처리 오류:", error);
    next(error);
  }
};

exports.processOrderData = async (req, res, next) => {
  try {
    const { orders, factoryId } = req.body;

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "주문 데이터(orders 배열)가 필요합니다",
      });
    }

    if (!factoryId) {
      return res.status(400).json({
        ok: false,
        message: "공장 ID(factoryId)가 필요합니다",
      });
    }

    const userId = req.session?.userId || null;

    const result = await orderProcessService.processOrderData(
      orders,
      parseInt(factoryId),
      userId
    );

    const statusCode = result.failed > 0 ? 207 : 200;

    res.status(statusCode).json({
      ok: result.failed === 0,
      message:
        result.failed === 0
          ? `${result.success}건의 주문이 성공적으로 처리되었습니다`
          : `${result.success}건 성공, ${result.failed}건 실패`,
      data: result,
    });
  } catch (error) {
    console.error("주문 데이터 처리 오류:", error);
    next(error);
  }
};

exports.getExcelTemplate = async (req, res, next) => {
  try {
    const xlsx = require("xlsx");
    const workbook = xlsx.utils.book_new();

    const templateData = [
      {
        품목코드: "FN-001",
        품목명: "애니콩 프리미엄 두부 (300g)",
        수량: 100,
        주문번호: "ORD-20241028-001",
        주문일시: "2024-10-28 09:00:00",
        수취인: "홍길동",
        주소: "서울특별시 강남구 테헤란로 123",
      },
      {
        품목코드: "FN-003",
        품목명: "애니콩 검은콩 두유 (1L)",
        수량: 50,
        주문번호: "ORD-20241028-002",
        주문일시: "2024-10-28 09:30:00",
        수취인: "김철수",
        주소: "경기도 성남시 분당구 판교역로 166",
      },
    ];

    const worksheet = xlsx.utils.json_to_sheet(templateData);

    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 30 },
      { wch: 8 },
      { wch: 18 },
      { wch: 20 },
      { wch: 12 },
      { wch: 40 },
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, "주문서");

    const excelBuffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + encodeURIComponent("주문서_템플릿.xlsx")
    );

    res.send(excelBuffer);
  } catch (error) {
    console.error("템플릿 생성 오류:", error);
    next(error);
  }
};


