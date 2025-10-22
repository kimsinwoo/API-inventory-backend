
async function createSession(req, user) {
  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.createdAt = Date.now();

  await new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function authenticate(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "세션 만료 또는 로그인 필요" });
    }

    const SESSION_MAX_AGE = 1000 * 60 * 60 * 24 * 7;
    const now = Date.now();
    const sessionAge = now - (req.session.createdAt || 0);

    if (sessionAge > SESSION_MAX_AGE) {
      const db = req.app.get("db");
      const user = await db.User.findByPk(req.session.userId);
      if (!user) return res.status(401).json({ message: "사용자 없음" });

      const user_profile = await db.userprofile

      await createSession(req, user);
    }

    next();
  } catch (err) {
    console.error("세션 인증 에러:", err);
    res.status(500).json({ message: "서버 오류" });
  }
}

module.exports = {
  createSession,
  authenticate,
};
