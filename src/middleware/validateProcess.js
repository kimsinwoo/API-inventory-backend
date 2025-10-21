"use strict";

module.exports = function validateProcess(req, res, next) {
  const { name } = req.body;

  if (typeof name !== "string") {
    return res.status(400).json({ ok: false, message: "name must be a string" });
  }
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return res.status(400).json({ ok: false, message: "name length must be 1~100" });
  }

  req.body.name = trimmed;
  next();
};
