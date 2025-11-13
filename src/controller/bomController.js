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
      // 1) BOM 생성
      const created = await svc.create(req.body);

      // 2) Items 테이블에서 동일 name 품목에 bom_id 연결
      //    Sequelize.update 반환값: [affectedCount]
      const [affectedCount] = await items.update(
        { bom_id: created.id },
        { where: { name: created.name } }
      );

      // 3) 연관된 품목이 하나도 없으면 에러 반환
      if (affectedCount === 0) {
        return res
          .status(400)
          .json({ ok: false, message: '품목을 등록해주세요.' });
      }

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
