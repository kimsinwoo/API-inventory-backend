"use strict";

module.exports = function pagination(req, res, next) {
  const pageRaw = req.query.page;
  const limitRaw = req.query.limit;

  let page = Number(pageRaw);
  let limit = Number(limitRaw);

  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) limit = 20;

  req.pagination = { page, limit, offset: (page - 1) * limit };
  next();
};
