/**
 * 입고/출고 예정 트랜잭션 컨트롤러
 */
const svc = require("../services/plannedTransactionService");

/* ===============================
 * 🔹 예정 트랜잭션 생성
 * =============================== */
exports.create = async (req, res, next) => {
  try {
    // TODO: 인증 미들웨어 활성화 후 실제 userId 사용
    const userId = req.session?.userId || "staff@dogsnack.com"; // 임시 기본값
    const result = await svc.createPlanned(req.body, userId);

    res.status(201).json({
      ok: true,
      message: result.message,
      data: result.planned,
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 예정 트랜잭션 목록 조회
 * =============================== */
exports.list = async (req, res, next) => {
  try {
    const result = await svc.listPlanned(req.query);

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
 * 🔹 예정 트랜잭션 상세 조회
 * =============================== */
exports.detail = async (req, res, next) => {
  try {
    const planned = await svc.getPlannedById(req.params.id);

    res.json({
      ok: true,
      data: planned,
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 예정 트랜잭션 수정
 * =============================== */
exports.update = async (req, res, next) => {
  try {
    const result = await svc.updatePlanned(req.params.id, req.body);

    res.json({
      ok: true,
      message: result.message,
      data: result.planned,
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 예정 트랜잭션 승인
 * =============================== */
exports.approve = async (req, res, next) => {
  try {
    // TODO: 인증 미들웨어 활성화 후 실제 userId 사용
    const userId = req.session?.userId || "manager@dogsnack.com"; // 임시 기본값
    const { comment } = req.body;
    const result = await svc.approvePlanned(req.params.id, userId, comment);

    res.json({
      ok: true,
      message: result.message,
      data: result.planned,
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 예정 트랜잭션 거부/취소
 * =============================== */
exports.reject = async (req, res, next) => {
  try {
    const result = await svc.rejectPlanned(req.params.id);

    res.json({
      ok: true,
      message: result.message,
      data: result.planned,
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 예정 입고 완료 처리
 * =============================== */
exports.completeReceive = async (req, res, next) => {
  try {
    const actualQuantity = typeof req.body.actualQuantity === 'string'
      ? Number(req.body.actualQuantity.replace(/,/g, '').trim())
      : req.body.actualQuantity;

    const payload = { actualQuantity }; // 필요시 receivedAt, note 등 추가
    const userId = req.session?.userId ?? "staff@dogsnack.com";

    const result = await svc.completePlannedReceive(req.params.id, payload, userId);

    res.json({
      ok: true,
      message: result.message,
      data: {
        planned: result.planned,
        completedPartial: result.completedPartial ?? null,
        inventory: result.inventory,
        barcode: result.barcode ?? null,
        labelPrint: result.labelPrint ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
};


/* ===============================
 * 🔹 예정 출고 완료 처리
 * =============================== */
exports.completeIssue = async (req, res, next) => {
  try {
    const actualQuantity = typeof req.body.actualQuantity === 'string'
      ? Number(req.body.actualQuantity.replace(/,/g, '').trim())
      : req.body.actualQuantity;

    const payload = { 
      actualQuantity,
      transferType: req.body.transferType, // FACTORY_TRANSFER, WAREHOUSE_TRANSFER, CUSTOMER, B2B
      labelSize: req.body.labelSize,
      labelQuantity: req.body.labelQuantity,
      printerName: req.body.printerName,
      shippingInfo: req.body.shippingInfo,
      note: req.body.note,
    };
    const userId = req.session?.userId ?? "staff@dogsnack.com";

    const result = await svc.completePlannedIssue(req.params.id, payload, userId);

    res.json({
      ok: true,
      message: result.message,
      data: {
        planned: result.planned,
        completedPartial: result.completedPartial ?? null,
        issued: result.issued,
        traces: result.traces,
        labelPrint: result.labelPrint ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 예정 트랜잭션 삭제
 * =============================== */
exports.remove = async (req, res, next) => {
  try {
    const result = await svc.deletePlanned(req.params.id);

    res.json({
      ok: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 통계
 * =============================== */
exports.stats = async (req, res, next) => {
  try {
    const stats = await svc.getPlannedStats(req.query);

    res.json({
      ok: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

