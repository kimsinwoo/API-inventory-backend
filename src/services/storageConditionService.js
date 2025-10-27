const db = require("../../models");
const { StorageCondition } = db;

exports.list = async () => {
  return StorageCondition.findAll({
    order: [["id", "ASC"]],
    attributes: ["id", "name", "temperature_range", "humidity_range", "created_at", "updated_at"],
  });
};

exports.get = async (id) => {
  return StorageCondition.findByPk(id, {
    attributes: ["id", "name", "temperature_range", "humidity_range", "created_at", "updated_at"],
  });
};

exports.create = async (payload) => {
  const { name, temperature_range, humidity_range } = payload;
  return StorageCondition.create({
    name: name.trim(),
    temperature_range: temperature_range?.trim() ?? null,
    humidity_range: humidity_range?.trim() ?? null,
  });
};

exports.update = async (id, payload) => {
  const existing = await StorageCondition.findByPk(id);
  if (!existing) throw new Error("NotFound");

  const updated = await existing.update({
    name: payload.name?.trim() ?? existing.name,
    temperature_range: payload.temperature_range?.trim() ?? existing.temperature_range,
    humidity_range: payload.humidity_range?.trim() ?? existing.humidity_range,
  });

  return updated;
};

exports.remove = async (id) => {
  return StorageCondition.destroy({ where: { id } });
};
