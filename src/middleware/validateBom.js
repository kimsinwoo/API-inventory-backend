function validLine(line = {}) {
    const hasItem = line.itemId !== undefined || (line.itemCode && String(line.itemCode).trim());
    const qtyOk = line.quantity !== undefined && !isNaN(Number(line.quantity)) && Number(line.quantity) > 0;
    const unitOk = line.unit !== undefined && String(line.unit).trim().length > 0;
    return hasItem && qtyOk && unitOk;
  }
  
  exports.validateBOMCreate = (req, res, next) => {
    const { name, lines } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ ok: false, message: "BOM 명(name)은 필수입니다." });
    }
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ ok: false, message: "lines는 1개 이상 필요합니다." });
    }
    if (!lines.every(validLine)) {
      return res.status(400).json({ ok: false, message: "lines 항목이 유효하지 않습니다." });
    }
    next();
  };
  
  exports.validateBOMUpdate = (req, res, next) => {
    const { name, lines } = req.body || {};
    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ ok: false, message: "name이 비어있습니다." });
    }
    if (lines !== undefined) {
      if (!Array.isArray(lines)) {
        return res.status(400).json({ ok: false, message: "lines 형식이 잘못되었습니다." });
      }
      if (lines.length === 0) {
        return res.status(400).json({ ok: false, message: "lines는 1개 이상이어야 합니다." });
      }
      if (!lines.every(validLine)) {
        return res.status(400).json({ ok: false, message: "lines 항목이 유효하지 않습니다." });
      }
    }
    next();
  };
  