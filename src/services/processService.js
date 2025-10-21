"use strict";

const db = require("../../models");
const { Op } = require("sequelize");

async function list({ page, limit, offset, search }) {
  const where = {};
  if (search && search.trim().length > 0) {
    where.name = { [Op.like]: `%${search.trim()}%` };
  }

  const { rows, count } = await db.Process.findAndCountAll({
    where,
    order: [["id", "DESC"]],
    limit,
    offset,
  });

  return {
    items: rows,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    page,
    limit,
  };
}

async function getById(id) {
  const found = await db.Process.findByPk(id, {
    include: [{ model: db.Factory }],
  });
  return found;
}

async function create({ name }) {
  const created = await db.Process.create({ name });
  return created;
}

async function update(id, { name }) {
  const found = await db.Process.findByPk(id);
  if (!found) {
    const e = new Error("Process not found");
    e.statusCode = 404;
    throw e;
  }
  await found.update({ name });
  return found;
}

async function remove(id) {
  return db.sequelize.transaction(async (t) => {
    await db.Factory.update({ process_id: null }, { where: { process_id: id }, transaction: t });
    const deleted = await db.Process.destroy({ where: { id }, transaction: t });
    return deleted;
  });
}

module.exports = { list, getById, create, update, remove };
