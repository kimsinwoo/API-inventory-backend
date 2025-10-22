const db = require("../../models");
const { Process, Factory } = db;

exports.listProcesses = async () => {
  return Process.findAll({ order: [["id", "ASC"]] });
};

exports.getProcess = async (id) => {
  return Process.findByPk(id, {
    include: [{ model: Factory, as: "factories", through: { attributes: [] } }],
  });
};

exports.createProcess = async ({ name }) => {
  return Process.create({ name });
};

exports.updateProcess = async (id, { name }) => {
  const proc = await Process.findByPk(id);
  if (!proc) return null;
  await proc.update({ name });
  return proc;
};

exports.deleteProcess = async (id) => {
  return Process.destroy({ where: { id } });
};
