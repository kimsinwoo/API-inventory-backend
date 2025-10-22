const svc = require("../services/processService");

module.exports = {
  index: async (req, res, next) => {
    try { res.json({ ok: true, data: await svc.listProcesses() }); }
    catch (e) { next(e); }
  },

  show: async (req, res, next) => {
    try {
      const one = await svc.getProcess(req.params.id);
      if (!one) return res.status(404).json({ ok: false, message: "Process not found" });
      res.json({ ok: true, data: one });
    } catch (e) { next(e); }
  },

  create: async (req, res, next) => {
    try { res.status(201).json({ ok: true, data: await svc.createProcess(req.body) }); }
    catch (e) { next(e); }
  },

  update: async (req, res, next) => {
    try {
      const up = await svc.updateProcess(req.params.id, req.body);
      if (!up) return res.status(404).json({ ok: false, message: "Process not found" });
      res.json({ ok: true, data: up });
    } catch (e) { next(e); }
  },

  destroy: async (req, res, next) => {
    try { res.json({ ok: true, deleted: await svc.deleteProcess(req.params.id) }); }
    catch (e) { next(e); }
  },
};
