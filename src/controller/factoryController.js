const svc = require("../services/factoryService");

exports.index = async (req, res, next) => {
  try {
    const list = await svc.listFactories();
    res.json({ ok: true, data: list });
  } catch (e) { next(e); }
};

exports.show = async (req, res, next) => {
  try {
    const one = await svc.getFactory(req.params.id);
    if (!one) return res.status(404).json({ ok: false, message: "Factory not found" });
    res.json({ ok: true, data: one });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const created = await svc.createFactory(req.body);
    res.status(201).json({ ok: true, data: created });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const updated = await svc.updateFactory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ ok: false, message: "Factory not found" });
    res.json({ ok: true, data: updated });
  } catch (e) { next(e); }
};

exports.destroy = async (req, res, next) => {
  try {
    const n = await svc.deleteFactory(req.params.id);
    res.json({ ok: true, deleted: n });
  } catch (e) { next(e); }
};

exports.addProcesses = async (req, res, next) => {
  try {
    const { processIds } = req.body; 
    const updated = await svc.addFactoryProcesses(req.params.id, processIds);
    if (!updated) return res.status(404).json({ ok: false, message: "Factory not found" });
    res.json({ ok: true, data: updated });
  } catch (e) { next(e); }
};

exports.removeProcess = async (req, res, next) => {
  try {
    const updated = await svc.removeFactoryProcess(req.params.id, req.params.processId);
    if (!updated) return res.status(404).json({ ok: false, message: "Factory or Process not found" });
    res.json({ ok: true, data: updated });
  } catch (e) { next(e); }
};
