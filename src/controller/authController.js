const { loginUser, logoutUser } = require("../services/authService");

async function login(req, res) {
  try {
    const { username, password } = req.body;
    const user = await loginUser(req, username, password);
    res.json({ message: "로그인 성공", user });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
}

async function logout(req, res) {
  try {
    await logoutUser(req);
    res.clearCookie("connect.sid");
    res.json({ message: "로그아웃 성공" });
  } catch (err) {
    res.status(500).json({ message: "로그아웃 실패" });
  }
}

module.exports = {
  login,
  logout,
};
