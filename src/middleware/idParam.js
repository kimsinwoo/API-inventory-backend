"use strict";

module.exports = function idParam(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: "Invalid id param" });
  }
  req.params.id = id;
  next();
};
