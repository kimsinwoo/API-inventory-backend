const svc = require("../services/itemService");

module.exports = {
  index: async (req, res, next) => {
    try { res.json({ ok: true, data: await svc.list() }); }
    catch (e) { next(e); }
  },

  showById: async (req, res, next) => {
    try {
      const one = await svc.getById(req.params.id);
      if (!one) return res.status(404).json({ ok: false, message: "Item not found" });
      res.json({ ok: true, data: one });
    } catch (e) { next(e); }
  },

  showByCode: async (req, res, next) => {
    try {
      const one = await svc.getByCode(req.params.code);
      if (!one) return res.status(404).json({ ok: false, message: "Item not found" });
      res.json({ ok: true, data: one });
    } catch (e) { next(e); }
  },

  create: async (req, res, next) => {
    try {
      const created = await svc.create(req.body);
      res.status(201).json({ ok: true, data: created });
    } catch (e) {
      if (e && e.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ ok: false, message: "이미 존재하는 code 입니다." });
      }
      next(e);
    }
  },

  update: async (req, res, next) => {
    try {
      const up = await svc.update(req.params.id, req.body);
      if (!up) return res.status(404).json({ ok: false, message: "Item not found" });
      res.json({ ok: true, data: up });
    } catch (e) { next(e); }
  },

  destroy: async (req, res, next) => {
    try { res.json({ ok: true, deleted: await svc.destroy(req.params.id) }); }
    catch (e) { next(e); }
  },
};
