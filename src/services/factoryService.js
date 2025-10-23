// services/factoryService.js
const db = require("../../models");
const { Factory, Process, Items, Inventories, sequelize } = db;
const { Op } = require("sequelize");

// 허용 타입 (모델/프론트와 합의된 값으로 맞추세요)
const FACTORY_TYPES = new Set(["1PreProcessing", "2Manufacturing"]);

function sanitizePayload(payload = {}) {
  const out = {};
  if (payload.type !== undefined) {
    const t = String(payload.type).trim();
    if (!FACTORY_TYPES.has(t)) {
      const err = new Error(`유효하지 않은 공장 유형입니다. (허용: ${[...FACTORY_TYPES].join(", ")})`);
      err.status = 400;
      throw err;
    }
    out.type = t;
  }
  if (payload.name !== undefined) out.name = String(payload.name).trim();
  if (payload.address !== undefined) out.address = String(payload.address || "").trim();
  return out;
}

exports.listFactories = async () => {
  return Factory.findAll({
    include: [{ model: Process, as: "processes", through: { attributes: [] } }],
    order: [["id", "ASC"]],
  });
};

exports.getFactory = async (id) => {
  return Factory.findByPk(id, {
    include: [{ model: Process, as: "processes", through: { attributes: [] } }],
  });
};

exports.createFactory = async (payload) => {
  const { processIds } = payload;
  const data = sanitizePayload(payload);

  const t = await sequelize.transaction();
  try {
    const factory = await Factory.create(data, { transaction: t });

    if (Array.isArray(processIds) && processIds.length) {
      const processes = await Process.findAll({ where: { id: processIds } });
      await factory.setProcesses(processes, { transaction: t });
    }

    const created = await Factory.findByPk(factory.id, {
      include: [{ model: Process, as: "processes", through: { attributes: [] } }],
      transaction: t,
    });

    await t.commit();
    return created;
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

exports.updateFactory = async (id, payload) => {
  const data = sanitizePayload(payload);
  const { processIds } = payload;

  const t = await sequelize.transaction();
  try {
    const factory = await Factory.findByPk(id, { transaction: t });
    if (!factory) return null;

    // 부분 업데이트만 적용
    if (Object.keys(data).length) {
      await factory.update(data, { transaction: t });
    }

    if (Array.isArray(processIds)) {
      const processes = await Process.findAll({ where: { id: processIds } });
      await factory.setProcesses(processes, { transaction: t });
    }

    const updated = await Factory.findByPk(id, {
      include: [{ model: Process, as: "processes", through: { attributes: [] } }],
      transaction: t,
    });

    await t.commit();
    return updated;
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

// ✅ 안전 삭제: 참조 존재 시 409 반환을 위해 에러 throw
exports.deleteFactory = async (id) => {
  const factory = await Factory.findByPk(id);
  if (!factory) return 0;

  const [itemCnt, invCnt] = await Promise.all([
    Items.count({ where: { factory_id: id } }),
    Inventories.count({ where: { factory_id: id } }),
  ]);

  if (itemCnt > 0 || invCnt > 0) {
    const msgParts = [];
    if (itemCnt) msgParts.push(`Items:${itemCnt}`);
    if (invCnt) msgParts.push(`Inventories:${invCnt}`);
    const err = new Error(`해당 공장을 참조하는 데이터가 있어 삭제할 수 없습니다. (${msgParts.join(", ")})`);
    err.status = 409;
    throw err;
  }

  // 연결된 공정 관계 정리(조인 테이블) — FK가 CASCADE면 생략 가능하지만 안전하게 처리
  await factory.setProcesses([]);

  return Factory.destroy({ where: { id } });
};

exports.addFactoryProcesses = async (id, processIds = []) => {
  const t = await sequelize.transaction();
  try {
    const factory = await Factory.findByPk(id, { transaction: t });
    if (!factory) return null;

    // 중복 추가 방지: 현재 세트 + 신규 세트를 합집합으로 만들기
    const current = await factory.getProcesses({ transaction: t });
    const currentIds = new Set(current.map((p) => p.id));
    const toAddIds = (Array.isArray(processIds) ? processIds : []).filter((pid) => !currentIds.has(pid));

    if (toAddIds.length) {
      const processes = await Process.findAll({ where: { id: toAddIds }, transaction: t });
      await factory.addProcesses(processes, { transaction: t });
    }

    const updated = await Factory.findByPk(id, {
      include: [{ model: Process, as: "processes", through: { attributes: [] } }],
      transaction: t,
    });

    await t.commit();
    return updated;
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

exports.removeFactoryProcess = async (id, processId) => {
  const t = await sequelize.transaction();
  try {
    const factory = await Factory.findByPk(id, { transaction: t });
    if (!factory) return null;

    const proc = await Process.findByPk(processId, { transaction: t });
    if (!proc) return null;

    await factory.removeProcess(proc, { transaction: t });

    const updated = await Factory.findByPk(id, {
      include: [{ model: Process, as: "processes", through: { attributes: [] } }],
      transaction: t,
    });

    await t.commit();
    return updated;
  } catch (e) {
    await t.rollback();
    throw e;
  }
};
