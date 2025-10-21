"use strict";

const db = require("../../models");
const { Op } = require("sequelize");

const ALLOWED_TYPES = Object.freeze(["1PreProcessing", "2Manufacturing"]);

async function list({ page, limit, offset, search, type, processId }) {
  const where = {};

  if (search && search.trim().length > 0) {
    where.name = { [Op.like]: `%${search.trim()}%` };
  }
  if (type && ALLOWED_TYPES.includes(type)) {
    where.type = type;
  }
  if (processId != null) {
    where.process_id = processId;
  }

  const { rows, count } = await db.Factory.findAndCountAll({
    where,
    order: [["id", "DESC"]],
    include: [{ model: db.Process, attributes: ["id", "name"] }],
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
  const found = await db.Factory.findByPk(id, {
    include: [{ model: db.Process, attributes: ["id", "name"] }],
  });
  return found;
}

async function ensureProcessIfProvided(process_id) {
  if (process_id == null) return;
  const p = await db.Process.findByPk(process_id);
  if (!p) {
    const e = new Error("Process not found for given process_id");
    e.statusCode = 400;
    throw e;
  }
}

async function create({ type, name, address, process_id }) {
  await ensureProcessIfProvided(process_id);
  const created = await db.Factory.create({ type, name, address: address || null, process_id: process_id || null });
  return created;
}

async function update(id, payload) {
  const found = await db.Factory.findByPk(id);
  if (!found) {
    const e = new Error("Factory not found");
    e.statusCode = 404;
    throw e;
  }

  const toUpdate = {};
  if (payload.type) toUpdate.type = payload.type;
  if (payload.name) toUpdate.name = payload.name;
  if (payload.address !== undefined) toUpdate.address = payload.address || null;

  if (Object.prototype.hasOwnProperty.call(payload, "process_id")) {
    const pid = payload.process_id;
    if (pid == null) {
      toUpdate.process_id = null;
    } else {
      await ensureProcessIfProvided(pid);
      toUpdate.process_id = pid;
    }
  }

  await found.update(toUpdate);
  return found;
}

async function remove(id) {
  // Inventory가 많다면 실제 삭제 대신 비활성화를 고려할 수도 있음.
  const deleted = await db.Factory.destroy({ where: { id } });
  return deleted; // 1 or 0
}

module.exports = { list, getById, create, update, remove };
