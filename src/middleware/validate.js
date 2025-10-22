exports.validateFactoryCreate = (req, res, next) => {
    const { type, name } = req.body || {};
    if (!type || !name) return res.status(400).json({ ok: false, message: "type, name는 필수입니다." });
    next();
  };
  
  exports.validateFactoryUpdate = (req, res, next) => {
    const { type, name, address, processIds } = req.body || {};
    if (type === undefined && name === undefined && address === undefined && processIds === undefined) {
      return res.status(400).json({ ok: false, message: "업데이트할 필드가 없습니다." });
    }
    next();
  };
  
  exports.validateProcessCreate = (req, res, next) => {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, message: "name은 필수입니다." });
    next();
  };
  