"use strict";

const ALLOWED_TYPES = Object.freeze(["1PreProcessing", "2Manufacturing"]);

module.exports = function validateFactory(req, res, next) {
  const { type, name, address, process_id } = req.body;

  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ ok: false, message: `type must be one of ${ALLOWED_TYPES.join(", ")}` });
  }
  if (typeof name !== "string") {
    return res.status(400).json({ ok: false, message: "name must be a string" });
  }
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return res.status(400).json({ ok: false, message: "name length must be 1~100" });
  }

  if (address != null && typeof address !== "string") {
    return res.status(400).json({ ok: false, message: "address must be a string if provided" });
  }

  if (process_id != null) {
    const pid = Number(process_id);
    if (!Number.isInteger(pid) || pid <= 0) {
      return res.status(400).json({ ok: false, message: "process_id must be a positive integer if provided" });
    }
    req.body.process_id = pid;
  }

  req.body.name = trimmed;
  next();
};
