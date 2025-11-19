"use strict";

const ROLE_BY_LEVEL = { 1: "EMPLOYEE", 2: "TEAM_LEAD", 3: "DIRECTOR", 4: "CEO" };

module.exports = (models) => {
  async function getUserWithPositionAndProfile(userId) {
    const user = await models.User.findByPk(userId, {
      include: [
        {
          model: models.UserProfile,
          as: "UserProfile",
        },
        {
          model: models.Position,
          as: "Positions",
          order: [["level", "DESC"]],
        },
      ],
    });

    if (!user) return null;

    const positions = user.Positions || [];
    let topPosition = null;
    if (positions.length > 0) {
      positions.sort((a, b) => b.level - a.level);
      topPosition = positions[0];
    }
    const roleCode = topPosition ? (ROLE_BY_LEVEL[topPosition.level] || "STAFF") : "STAFF";

    return {
      id: user.id,
      profile_id: user.profile_id,
      profile: user.UserProfile,
      position: topPosition,
      roleCode,
    };
  }

  const requireAuth = async function (req, res, next) {
    try {
      // Development 환경에서는 인증 건너뛰기
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Development 모드: requireAuth 건너뛰기');
        if (!req.user) {
          req.user = { id: 'dev-user', roleCode: 'CEO' };
        }
        return next();
      }

      const auth = req.headers.authorization || "";
      if (!auth.startsWith("Bearer "))
        return res.status(401).json({ ok: false, message: "Unauthorized" });

      const userId = auth.replace("Bearer ", "").trim();

      const userInfo = await getUserWithPositionAndProfile(userId);
      if (!userInfo) return res.status(401).json({ ok: false, message: "Unauthorized" });

      req.user = userInfo;
      next();
    } catch (e) {
      console.error("auth error", e);
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
  };

  const requireAdmin = async function (req, res, next) {
    try {
      // Development 환경에서는 인증 건너뛰기
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Development 모드: requireAdmin 건너뛰기');
        if (!req.user) {
          req.user = { id: 'dev-user', roleCode: 'CEO' };
        }
        return next();
      }

      const auth = req.headers.authorization || "";
      if (!auth.startsWith("Bearer "))
        return res.status(401).json({ ok: false, message: "Unauthorized" });

      const userId = auth.replace("Bearer ", "").trim();

      const userInfo = await getUserWithPositionAndProfile(userId);
      if (!userInfo) return res.status(401).json({ ok: false, message: "Unauthorized" });

      if (userInfo.roleCode !== "CEO" && userInfo.roleCode !== "DIRECTOR") {
        return res.status(403).json({ ok: false, message: "Forbidden" });
      }

      req.user = userInfo;
      next();
    } catch (e) {
      console.error("auth error", e);
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
  };

  const requireUser = async function (req, res, next) {
    try {
      // Development 환경에서는 인증 건너뛰기
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Development 모드: requireUser 건너뛰기');
        if (!req.user) {
          req.user = { id: 'dev-user', roleCode: 'CEO' };
        }
        return next();
      }

      const auth = req.headers.authorization || "";
      if (!auth.startsWith("Bearer "))
        return res.status(401).json({ ok: false, message: "Unauthorized" });

      const userId = auth.replace("Bearer ", "").trim();
      const userInfo = await getUserWithPositionAndProfile(userId);
      if (!userInfo) return res.status(401).json({ ok: false, message: "Unauthorized" });

      req.user = userInfo;
      next();
    } catch (e) {
      console.error("auth error", e);
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
  };

  const requireStaff = async function (req, res, next) {
    try {
      // Development 환경에서는 인증 건너뛰기
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Development 모드: requireStaff 건너뛰기');
        if (!req.user) {
          req.user = { id: 'dev-user', roleCode: 'CEO' };
        }
        return next();
      }

      const auth = req.headers.authorization || "";
      if (!auth.startsWith("Bearer "))
        return res.status(401).json({ ok: false, message: "Unauthorized" });

      const userId = auth.replace("Bearer ", "").trim();
      const userInfo = await getUserWithPositionAndProfile(userId);
      if (!userInfo) return res.status(401).json({ ok: false, message: "Unauthorized" });

      req.user = userInfo;
      next();
    } catch (e) {
      console.error("auth error", e);
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
  };

  const requireTeamLead = async function (req, res, next) {
    try {
      // Development 환경에서는 인증 건너뛰기
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Development 모드: requireTeamLead 건너뛰기');
        if (!req.user) {
          req.user = { id: 'dev-user', roleCode: 'CEO' };
        }
        return next();
      }

      const auth = req.headers.authorization || "";
      if (!auth.startsWith("Bearer "))
        return res.status(401).json({ ok: false, message: "Unauthorized" });

      const userId = auth.replace("Bearer ", "").trim();
      const userInfo = await getUserWithPositionAndProfile(userId);
      if (!userInfo) return res.status(401).json({ ok: false, message: "Unauthorized" });

      if (!["TEAM_LEAD", "DIRECTOR", "CEO"].includes(userInfo.roleCode)) {
        return res.status(403).json({ ok: false, message: "Forbidden" });
      }

      req.user = userInfo;
      next();
    } catch (e) {
      console.error("auth error", e);
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
  };

  const requireDirector = async function (req, res, next) {
    try {
      // Development 환경에서는 인증 건너뛰기
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Development 모드: requireDirector 건너뛰기');
        if (!req.user) {
          req.user = { id: 'dev-user', roleCode: 'CEO' };
        }
        return next();
      }

      const auth = req.headers.authorization || "";
      if (!auth.startsWith("Bearer "))
        return res.status(401).json({ ok: false, message: "Unauthorized" });

      const userId = auth.replace("Bearer ", "").trim();
      const userInfo = await getUserWithPositionAndProfile(userId);
      if (!userInfo) return res.status(401).json({ ok: false, message: "Unauthorized" });

      if (userInfo.roleCode !== "DIRECTOR" && userInfo.roleCode !== "CEO") {
        return res.status(403).json({ ok: false, message: "Forbidden" });
      }

      req.user = userInfo;
      next();
    } catch (e) {
      console.error("auth error", e);
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
  };

  const requireCEO = async function (req, res, next) {
    try {
      // Development 환경에서는 인증 건너뛰기
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Development 모드: requireCEO 건너뛰기');
        if (!req.user) {
          req.user = { id: 'dev-user', roleCode: 'CEO' };
        }
        return next();
      }

      const auth = req.headers.authorization || "";
      if (!auth.startsWith("Bearer "))
        return res.status(401).json({ ok: false, message: "Unauthorized" });

      const userId = auth.replace("Bearer ", "").trim();
      const userInfo = await getUserWithPositionAndProfile(userId);
      if (!userInfo) return res.status(401).json({ ok: false, message: "Unauthorized" });

      if (userInfo.roleCode !== "CEO") {
        return res.status(403).json({ ok: false, message: "Forbidden" });
      }

      req.user = userInfo;
      next();
    } catch (e) {
      console.error("auth error", e);
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
  };

  return {
    requireAuth,
    requireAdmin,
    requireUser,
    requireStaff,
    requireTeamLead,
    requireDirector,
    requireCEO,
  };
};
