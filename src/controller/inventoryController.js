const svc = require("../services/inventoryService");

module.exports = {
  index: async (req, res, next) => {
    try {
      const list = await svc.list(req.query);
      const summary = await svc.summary({ factoryId: req.query.factoryId });
      res.json({ ok: true, data: list.items, meta: { ...list.meta, summary } });
    } catch (e) { next(e); }
  },

  summary: async (req, res, next) => {
    try {
      const out = await svc.summary({ factoryId: req.query.factoryId });
      res.json({ ok: true, data: out });
    } catch (e) { next(e); }
  },

  utilization: async (_req, res, next) => {
    try {
      const out = await svc.utilization();
      res.json({ ok: true, data: out });
    } catch (e) { next(e); }
  },

  movements: async (req, res, next) => {
    try {
      const out = await svc.movements(req.query);
      res.json({ ok: true, data: out.items, meta: out.meta });
    } catch (e) { next(e); }
  },

  receive: async (req, res, next) => {
    try {
      const created = await svc.receive(req.body);
      res.status(201).json({ ok: true, data: created });
    } catch (e) { next(e); }
  },

  issue: async (req, res, next) => {
    try {
      const result = await svc.issue(req.body);
      res.json({ ok: true, data: result });
    } catch (e) { next(e); }
  },

  transfer: async (req, res, next) => {
    try {
      const result = await svc.transfer(req.body);
      res.json({ ok: true, data: result });
    } catch (e) { next(e); }
  },

  destroy: async (req, res, next) => {
    try {
      const deleted = await svc.remove(req.params.id);
      res.json({ ok: true, deleted });
    } catch (e) { next(e); }
  },
};
