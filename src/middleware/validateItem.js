// src/middleware/validate.js
exports.validateItemCreate = (req, res, next) => {
  try {
    const b = req.body || {};

    const normCategory = (v) => {
      if (!v) return null;
      const s = String(v).trim();
      const map = {
        '원재료': 'RawMaterial',
        'rawmaterial': 'RawMaterial',
        'raw_material': 'RawMaterial',

        '반재료': 'SemiFinished',
        '반제품': 'SemiFinished',
        'semifinished': 'SemiFinished',
        'semi_finished': 'SemiFinished',

        '완제품': 'Finished',
        'finished': 'Finished',

        '소모품': 'Supply',
        'supply': 'Supply',
      };
      return map[s.toLowerCase()] || (['RawMaterial','SemiFinished','Finished','Supply'].includes(s) ? s : null);
    };

    const normUnit = (v) => {
      if (!v) return null;
      const s = String(v).trim().toLowerCase();
      const map = { kg: 'kg', g: 'g', ea: 'EA', box: 'BOX', pcs: 'PCS' };
      return map[s] || (['kg','g','EA','BOX','PCS'].includes(v) ? v : null);
    };

    const payload = {
      code: String(b.code || '').trim(),
      name: String(b.name || '').trim(),
      category: normCategory(b.category),
      unit: normUnit(b.unit),

      // FK 매핑
      factory_id: b.factoryId != null ? Number(b.factoryId) : null,

      // 숫자 필드
      shortage: b.shortage != null ? Number(b.shortage) : 0,

      // 모델이 NOT NULL이면 기본값 0으로 보정 (일수 기준)
      expiration_date: b.shelfLife != null && b.shelfLife !== ''
        ? Number(b.shelfLife)
        : 0,

      // 도매가: Items 모델에 컬럼이 있으면 저장, 없으면 Sequelize가 무시합니다.
      wholesale_price: b.wholesalePrice != null ? Number(b.wholesalePrice) : null,
    };

    // 필수값 검증
    const errors = [];
    if (!payload.code) errors.push('code');
    if (!payload.name) errors.push('name');
    if (!payload.category) errors.push('category');
    if (!payload.unit) errors.push('unit');
    if (payload.factory_id == null || Number.isNaN(payload.factory_id)) errors.push('factoryId');

    if (errors.length) {
      return res.status(400).json({
        ok: false,
        message: `필수 필드 누락/형식 오류: ${errors.join(', ')}`,
      });
    }

    req.body = payload;
    next();
  } catch (e) {
    next(e);
  }
};
