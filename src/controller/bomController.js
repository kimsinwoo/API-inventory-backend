const svc = require("../services/bomService");

module.exports = {
  index: async (req, res, next) => {
    try {
      const { search = "", page = 1, limit = 50 } = req.query || {};
      const result = await svc.list({ search, page, limit });
      res.json({ ok: true, ...result });
    } catch (e) { next(e); }
  },

  show: async (req, res, next) => {
    try {
      const one = await svc.get(req.params.id);
      if (!one) return res.status(404).json({ ok: false, message: "BOM not found" });
      res.json({ ok: true, data: one });
    } catch (e) { next(e); }
  },

  create: async (req, res, next) => {
    try {
      const created = await svc.create(req.body);
      res.status(201).json({ ok: true, data: created });
    } catch (e) {
      if (e && e.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ ok: false, message: "이미 존재하는 BOM 명입니다." });
      }
      next(e);
    }
  },

  update: async (req, res, next) => {
    try {
      const up = await svc.update(req.params.id, req.body);
      if (!up) return res.status(404).json({ ok: false, message: "BOM not found" });
      res.json({ ok: true, data: up });
    } catch (e) { next(e); }
  },

  destroy: async (req, res, next) => {
    try { res.json({ ok: true, deleted: await svc.destroy(req.params.id) }); }
    catch (e) { next(e); }
  },
};
