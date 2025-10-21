"use strict";

const ROLE_BY_LEVEL = { 1: "EMPLOYEE", 2: "TEAM_LEAD", 3: "DIRECTOR", 4: "CEO" };

module.exports = (models) => {
  return async function requireAuth(req, res, next) {
    try {
      const auth = req.headers.authorization || "";
      if (!auth.startsWith("Bearer ")) return res.status(401).json({ ok: false, message: "Unauthorized" });

      const userId = auth.replace("Bearer ", "");
      const pos = await models.Position.findOne({ where: { user_id: userId }, order: [["level", "DESC"]] });
      const roleCode = ROLE_BY_LEVEL[pos?.level] || "STAFF";

      req.user = { id: userId, roleCode };
      next();
    } catch (e) {
      console.error("auth error", e);
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
  };
};
