/**
 * 생산 작업 지시서 컨트롤러
 */
const svc = require("../services/workOrderService");

/**
 * 작업 지시서 생성
 */
exports.create = async (req, res, next) => {
  try {
    const userId = req.session?.userId || null;
    const result = await svc.createWorkOrder(req.body, userId);

    res.status(201).json({
      ok: true,
      message: result.message,
      data: result.workOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 작업 지시서 목록 조회
 */
exports.list = async (req, res, next) => {
  try {
    const result = await svc.listWorkOrders(req.query);

    res.json({
      ok: true,
      data: result.items,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 작업 지시서 상세 조회
 */
exports.detail = async (req, res, next) => {
  try {
    const workOrder = await svc.getWorkOrderById(req.params.id);

    res.json({
      ok: true,
      data: workOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 작업 지시서 수정
 */
exports.update = async (req, res, next) => {
  try {
    const result = await svc.updateWorkOrder(req.params.id, req.body);

    res.json({
      ok: true,
      message: result.message,
      data: result.workOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 작업 지시서 삭제
 */
exports.remove = async (req, res, next) => {
  try {
    const result = await svc.deleteWorkOrder(req.params.id);

    res.json({
      ok: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 작업 시작
 */
exports.start = async (req, res, next) => {
  try {
    const userId = req.session?.userId || null;
    const result = await svc.startWorkOrder(req.params.id, userId);

    res.json({
      ok: true,
      message: result.message,
      data: result.workOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 생산 완료 처리
 */
exports.complete = async (req, res, next) => {
  try {
    const userId = req.session?.userId || null;
    const result = await svc.completeWorkOrder(req.params.id, req.body, userId);

    res.json({
      ok: true,
      message: result.message,
      data: {
        workOrder: result.workOrder,
        producedProduct: result.producedProduct,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 작업 취소
 */
exports.cancel = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await svc.cancelWorkOrder(req.params.id, reason);

    res.json({
      ok: true,
      message: result.message,
      data: result.workOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 통계
 */
exports.stats = async (req, res, next) => {
  try {
    const stats = await svc.getWorkOrderStats(req.query);

    res.json({
      ok: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

