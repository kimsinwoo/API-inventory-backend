const { z } = require("zod");

function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (e) {
      res.status(400).json({ ok: false, message: "ValidationError", detail: e.errors ?? String(e) });
    }
  };
}

exports.createRules = validate({
  body: z.object({
    name: z.string().trim().min(1).max(50),
    temperature_range: z.string().trim().min(1).max(50).optional(),
    humidity_range: z.string().trim().min(1).max(50).optional(),
  }),
});

exports.updateRules = validate({
  body: z.object({
    name: z.string().trim().min(1).max(50).optional(),
    temperature_range: z.string().trim().min(1).max(50).optional(),
    humidity_range: z.string().trim().min(1).max(50).optional(),
  }),
});
