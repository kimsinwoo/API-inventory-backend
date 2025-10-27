/**
 * 공장/창고 간 이동 컨트롤러
 */
const svc = require("../services/warehouseTransferService");

/* ===============================
 * 🔹 공장/창고 간 이동
 * =============================== */
exports.transfer = async (req, res, next) => {
  try {
    // 세션에서 사용자 ID 가져오기
    const userId = req.session?.userId || null;

    const result = await svc.transferBetweenLocations(req.body, userId);

    res.json({
      ok: true,
      message: result.message,
      data: {
        moved: result.moved,
        newLotId: result.newLotId,
        newLotNumber: result.newLotNumber,
        traces: result.traces,
        movementType: result.movementType,
        sourceLocation: result.sourceLocation,
        destLocation: result.destLocation,
        transferredBy: result.userInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
 * 🔹 이동 이력 조회
 * =============================== */
exports.history = async (req, res, next) => {
  try {
    const result = await svc.getTransferHistory(req.query);

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
 * 🔹 이동 경로 통계
 * =============================== */
exports.pathStats = async (req, res, next) => {
  try {
    const stats = await svc.getTransferPathStats(req.query);

    res.json({
      ok: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

