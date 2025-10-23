// src/controller/itemController.js
const svc = require('../services/itemService');

exports.index = async (req, res, next) => {
  try {
    const rows = await svc.listItems();
    res.json({ ok: true, data: rows });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    console.log('=== CREATE ITEM ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    // validateItemCreate 가 req.body를 표준화해 둠
    const created = await svc.createItem(req.body);
    console.log('Created item:', JSON.stringify(created, null, 2));
    res.status(201).json({ ok: true, data: created });
  } catch (e) { 
    console.error('=== ERROR IN CREATE ===');
    console.error(e);
    next(e); 
  }
};

exports.show = async (req, res, next) => {
  try {
    const one = await svc.getItem(req.params.id);
    if (!one) return res.status(404).json({ ok: false, message: 'Item not found' });
    res.json({ ok: true, data: one });
  } catch (e) { next(e); }
};

exports.showById = async (req, res, next) => {
  try {
    const one = await svc.getItem(req.params.id);
    if (!one) return res.status(404).json({ ok: false, message: 'Item not found' });
    res.json({ ok: true, data: one });
  } catch (e) { next(e); }
};

exports.showByCode = async (req, res, next) => {
  try {
    const one = await svc.getItemByCode(req.params.code);
    if (!one) return res.status(404).json({ ok: false, message: 'Item not found' });
    res.json({ ok: true, data: one });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const updated = await svc.updateItem(req.params.id, req.body);
    if (!updated) return res.status(404).json({ ok: false, message: 'Item not found' });
    res.json({ ok: true, data: updated });
  } catch (e) { next(e); }
};

exports.destroy = async (req, res, next) => {
  try {
    const n = await svc.deleteItem(req.params.id);
    res.json({ ok: true, deleted: n });
  } catch (e) { next(e); }
};
