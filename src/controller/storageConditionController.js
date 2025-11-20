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
      if (e.status === 404) return res.status(404).json({ ok: false, message: e.message });
      next(e);
    }
  },

  update: async (req, res, next) => {
    try {
      const updated = await svc.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ ok: false, message: "NotFound" });
      res.json({ ok: true, data: updated });
    } catch (e) {
      if (e.status === 404) return res.status(404).json({ ok: false, message: e.message });
      next(e);
    }
  },

  addItems: async (req, res, next) => {
    try {
      const { itemNames } = req.body;
      
      // itemNames가 없거나 배열이 아니면 에러
      if (!itemNames || !Array.isArray(itemNames) || itemNames.length === 0) {
        return res.status(400).json({ 
          ok: false, 
          message: "itemNames는 비어있지 않은 배열이어야 합니다." 
        });
      }

      const updated = await svc.addItems(req.params.id, itemNames);
      if (!updated) return res.status(404).json({ ok: false, message: "StorageCondition not found" });
      res.json({ ok: true, data: updated });
    } catch (e) {
      if (e.status === 400) return res.status(400).json({ ok: false, message: e.message });
      if (e.status === 404) return res.status(404).json({ ok: false, message: e.message });
      next(e);
    }
  },

  removeItem: async (req, res, next) => {
    try {
      const { itemName } = req.body;
      if (!itemName) {
        return res.status(400).json({ 
          ok: false, 
          message: "itemName은 필수입니다." 
        });
      }
      
      const updated = await svc.removeItem(req.params.id, itemName);
      if (!updated) return res.status(404).json({ ok: false, message: "StorageCondition not found" });
      res.json({ ok: true, data: updated });
    } catch (e) {
      if (e.status === 404) return res.status(404).json({ ok: false, message: e.message });
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
