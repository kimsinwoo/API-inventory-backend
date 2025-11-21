const svc = require("../services/bomService");
const { Items } = require("../../models");

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
      // code 파라미터 지원: ?code=ITEM001
      if (req.query && req.query.code) {
        const item = await Items.findOne({ where: { code: req.query.code } });
        if (!item || !item.bom_id) {
          return res.status(404).json({ ok: false, message: "해당 코드의 품목, BOM이 없습니다." });
        }
        const bom = await svc.get(item.bom_id);
        if (!bom) {
          return res.status(404).json({ ok: false, message: "BOM not found" });
        }
        return res.json({ ok: true, data: bom });
      }
      // 기존: id로 찾기
      const one = await svc.get(req.params.id);
      if (!one) return res.status(404).json({ ok: false, message: "BOM not found" });
      res.json({ ok: true, data: one });
    } catch (e) { next(e); }
  },

  create: async (req, res, next) => {
    try {
      // 1) BOM 생성
      const created = await svc.create(req.body);

      // 4) 정상: BOM + 품목 연결 완료
      return res.status(201).json({ ok: true, data: created });
    } catch (e) {
      if (e && e.name === 'SequelizeUniqueConstraintError') {
        return res
          .status(409)
          .json({ ok: false, message: '이미 존재하는 BOM 명입니다.' });
      }
      return next(e);
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
