const db = require("../../models");
const { Factory, Process } = db;

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
  const { type, name, address, processIds } = payload;
  const t = await db.sequelize.transaction();
  try {
    const factory = await Factory.create({ type, name, address }, { transaction: t });
    if (Array.isArray(processIds) && processIds.length) {
      const processes = await Process.findAll({ where: { id: processIds } });
      await factory.setProcesses(processes, { transaction: t });
    }
    await t.commit();
    return factory;
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

exports.updateFactory = async (id, payload) => {
  const { type, name, address, processIds } = payload;
  const t = await db.sequelize.transaction();
  try {
    const factory = await Factory.findByPk(id, { transaction: t });
    if (!factory) return null;

    await factory.update({ type, name, address }, { transaction: t });

    if (Array.isArray(processIds)) {
      const processes = await Process.findAll({ where: { id: processIds } });
      await factory.setProcesses(processes, { transaction: t });
    }
    await t.commit();

    return await Factory.findByPk(id, {
      include: [{ model: Process, as: "processes", through: { attributes: [] } }],
    });
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

exports.deleteFactory = async (id) => {
  return Factory.destroy({ where: { id } });
};

exports.addFactoryProcesses = async (id, processIds = []) => {
  const factory = await Factory.findByPk(id);
  if (!factory) return null;
  const processes = await Process.findAll({ where: { id: processIds } });
  await factory.addProcesses(processes);
  return Factory.findByPk(id, {
    include: [{ model: Process, as: "processes", through: { attributes: [] } }],
  });
};

exports.removeFactoryProcess = async (id, processId) => {
  const factory = await Factory.findByPk(id);
  if (!factory) return null;
  const proc = await Process.findByPk(processId);
  if (!proc) return null;
  await factory.removeProcess(proc);
  return Factory.findByPk(id, {
    include: [{ model: Process, as: "processes", through: { attributes: [] } }],
  });
};
