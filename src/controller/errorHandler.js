"use strict";

function notFound(req, res, next) {
  res.status(404).json({ ok: false, message: "Not Found" });
}

function errorHandler(err, req, res, next) { 
  const status = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const payload = {
    ok: false,
    message: err.message || "Internal Server Error",
  };
  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
