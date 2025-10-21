"use strict";

const asyncHandler = require("../middleware/asyncHandler");
const service = require("../services/processService");

exports.list = asyncHandler(async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const result = await service.list({ ...req.pagination, search });
  res.status(200).json({ ok: true, data: result });
});

exports.detail = asyncHandler(async (req, res) => {
  const found = await service.getById(req.params.id);
  if (!found) return res.status(404).json({ ok: false, message: "Process not found" });
  res.status(200).json({ ok: true, data: found });
});

exports.create = asyncHandler(async (req, res) => {
  const created = await service.create({ name: req.body.name });
  res.status(201).json({ ok: true, data: created });
});

exports.update = asyncHandler(async (req, res) => {
  const updated = await service.update(req.params.id, { name: req.body.name });
  res.status(200).json({ ok: true, data: updated });
});

exports.remove = asyncHandler(async (req, res) => {
  const deleted = await service.remove(req.params.id);
  if (deleted === 0) return res.status(404).json({ ok: false, message: "Process not found" });
  res.status(200).json({ ok: true, message: "Deleted" });
});
