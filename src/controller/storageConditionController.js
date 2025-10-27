const svc = require("../services/storageConditionService");

module.exports = {
  index: async (req, res, next) => {
    try {
      const list = await svc.list();
      res.json({ ok: true, data: list });
    } catch (e) {
      next(e);
    }
  },

  detail: async (req, res, next) => {
    try {
      const result = await svc.get(req.params.id);
      if (!result) return res.status(404).json({ ok: false, message: "NotFound" });
      res.json({ ok: true, data: result });
    } catch (e) {
      next(e);
    }
  },

  create: async (req, res, next) => {
    try {
      const created = await svc.create(req.body);
      res.status(201).json({ ok: true, data: created });
    } catch (e) {
      next(e);
    }
  },

  update: async (req, res, next) => {
    try {
      const updated = await svc.update(req.params.id, req.body);
      res.json({ ok: true, data: updated });
    } catch (e) {
      next(e);
    }
  },

  destroy: async (req, res, next) => {
    try {
      const deleted = await svc.remove(req.params.id);
      res.json({ ok: true, deleted });
    } catch (e) {
      next(e);
    }
  },
};
