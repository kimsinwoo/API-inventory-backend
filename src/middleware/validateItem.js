exports.validateItemCreate = (req, res, next) => {
    const {
      code, name, category, factoryId, storage, shortage, unit,
    } = req.body || {};
  
    if (!code || !String(code).trim()) {
      return res.status(400).json({ ok: false, message: "code는 필수입니다." });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ ok: false, message: "name은 필수입니다." });
    }
    if (!category) {
      return res.status(400).json({ ok: false, message: "category는 필수입니다." });
    }
    if (!unit) {
      return res.status(400).json({ ok: false, message: "unit은 필수입니다.(kg/g/EA/BOX/PCS)" });
    }
    if (factoryId !== undefined && isNaN(Number(factoryId))) {
      return res.status(400).json({ ok: false, message: "factoryId는 숫자여야 합니다." });
    }
    if (shortage !== undefined && isNaN(Number(shortage))) {
      return res.status(400).json({ ok: false, message: "shortage는 숫자여야 합니다." });
    }
  
    // 캐스팅
    if (factoryId !== undefined) req.body.factoryId = Number(factoryId);
    if (shortage !== undefined) req.body.shortage = Number(shortage);
  
    next();
  };
  
  exports.validateItemUpdate = (req, res, next) => {
    const allowed = ["name","category","factoryId","storage","shortage","unit"];
    const body = req.body || {};
    const hasAny = Object.keys(body).some((k) => allowed.includes(k));
    if (!hasAny) {
      return res.status(400).json({ ok: false, message: "업데이트할 필드가 없습니다." });
    }
    if (body.factoryId !== undefined && isNaN(Number(body.factoryId))) {
      return res.status(400).json({ ok: false, message: "factoryId는 숫자여야 합니다." });
    }
    if (body.shortage !== undefined && isNaN(Number(body.shortage))) {
      return res.status(400).json({ ok: false, message: "shortage는 숫자여야 합니다." });
    }
    if (body.factoryId !== undefined) body.factoryId = Number(body.factoryId);
    if (body.shortage !== undefined) body.shortage = Number(body.shortage);
    next();
  };
  