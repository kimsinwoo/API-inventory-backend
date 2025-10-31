const allowedSourcesByIssueType = {
  B2B: new Set(["selfmall"]),
  B2C: new Set(["selfmall", "coupang", "smartstore"]),
};

function validateShippingParams(req, res, next) {
  const issueType = (req.body.issueType || req.query.issueType || "").toUpperCase();
  const source = (req.body.source || req.query.source || "").toLowerCase();

  if (!issueType || !["B2B", "B2C"].includes(issueType)) {
    return res.status(400).json({ ok: false, message: "issueType은 B2B 또는 B2C 여야 합니다" });
  }

  if (!source) {
    return res.status(400).json({ ok: false, message: "source 필드는 필수입니다" });
  }

  const allowed = allowedSourcesByIssueType[issueType];
  if (!allowed.has(source)) {
    return res.status(400).json({ ok: false, message: `${issueType}에서는 ${Array.from(allowed).join(", ")}만 허용됩니다` });
  }

  req.validatedIssueType = issueType;
  req.validatedSource = source;
  next();
}

module.exports = {
  validateShippingParams,
};


