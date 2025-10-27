/**
 * 입고/출고 트랜잭션 컨트롤러
 */
const svc = require("../services/inventoryTransactionService");

/* ===============================
 * 🔹 입고 처리
 * =============================== */
exports.receive = async (req, res, next) => {
  try {
    // 세션에서 사용자 ID 가져오기
    const userId = req.session?.userId || null;
    
    const result = await svc.receiveTransaction(req.body, userId);
    
    res.status(201).json({
      ok: true,
      message: result.message,
      data: {
        inventory: result.inventory,
        receivedBy: result.userInfo,
        label: result.label, // 라벨 정보 포함
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 출고 처리
 * =============================== */
exports.issue = async (req, res, next) => {
  try {
    // 세션에서 사용자 ID 가져오기
    const userId = req.session?.userId || null;
    
    const result = await svc.issueTransaction(req.body, userId);
    
    res.json({
      ok: true,
      message: result.message,
      data: {
        issued: result.issued,
        traces: result.traces,
        issuedBy: result.userInfo,
        shippingInfo: result.shippingInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 공장 간 이동
 * =============================== */
exports.transfer = async (req, res, next) => {
  try {
    // 세션에서 사용자 ID 가져오기
    const userId = req.session?.userId || null;
    
    const result = await svc.transferTransaction(req.body, userId);
    
    res.json({
      ok: true,
      message: result.message,
      data: {
        moved: result.moved,
        newLotId: result.lotId,
        traces: result.traces,
        transferredBy: result.userInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 일괄 출고 처리 (배송 관리용)
 * =============================== */
exports.batchIssue = async (req, res, next) => {
  try {
    // 세션에서 사용자 ID 가져오기
    const userId = req.session?.userId || null;
    
    const { transactions } = req.body;
    const result = await svc.batchIssueTransactions(transactions, userId);
    
    res.json({
      ok: true,
      message: `총 ${result.total}건 중 ${result.success}건 성공, ${result.failed}건 실패`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 트랜잭션 목록 조회
 * =============================== */
exports.list = async (req, res, next) => {
  try {
    const result = await svc.listTransactions(req.query);
    
    res.json({
      ok: true,
      data: result.items,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 트랜잭션 상세 조회
 * =============================== */
exports.detail = async (req, res, next) => {
  try {
    const transaction = await svc.getTransactionById(req.params.id);
    
    res.json({
      ok: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 트랜잭션 통계
 * =============================== */
exports.stats = async (req, res, next) => {
  try {
    const stats = await svc.getTransactionStats(req.query);
    
    res.json({
      ok: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 월별 입출고 현황 (창고 이용률용)
 * =============================== */
exports.monthlyUtilization = async (req, res, next) => {
  try {
    const { factoryId, year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        ok: false,
        message: "년도(year)와 월(month)은 필수입니다",
      });
    }

    const dayjs = require("dayjs");
    const startDate = dayjs(`${year}-${month}-01`).startOf("month").toISOString();
    const endDate = dayjs(`${year}-${month}-01`).endOf("month").toISOString();

    const stats = await svc.getTransactionStats({
      factoryId,
      startDate,
      endDate,
    });

    // 출고 및 공장 이동이 발생한 품목
    const outboundItems = stats.topItems.filter((item) =>
      ["ISSUE", "TRANSFER_OUT"].includes(item.type)
    );

    // 입고 및 제조된 품목
    const inboundItems = stats.topItems.filter((item) =>
      ["RECEIVE", "TRANSFER_IN"].includes(item.type)
    );

    res.json({
      ok: true,
      data: {
        period: `${year}년 ${month}월`,
        outbound: {
          title: "출고 및 이동 발생 품목",
          items: outboundItems,
          totalCount: outboundItems.length,
        },
        inbound: {
          title: "입고 및 제조된 품목",
          items: inboundItems,
          totalCount: inboundItems.length,
        },
        utilizationRate: {
          inbound: stats.summary.byType.find((t) =>
            ["RECEIVE", "TRANSFER_IN"].includes(t.type)
          )?.totalQuantity || 0,
          outbound: stats.summary.byType.find((t) =>
            ["ISSUE", "TRANSFER_OUT"].includes(t.type)
          )?.totalQuantity || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

