const svc = require("../services/inventoryService");

module.exports = {
  index: async (req, res, next) => {
    try {
      const { itemId, factoryId, status } = req.query || {};
      const list = await svc.list({
        itemId: itemId ? Number(itemId) : undefined,
        factoryId: factoryId ? Number(factoryId) : undefined,
        status,
      });
      res.json({ ok: true, data: list });
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
