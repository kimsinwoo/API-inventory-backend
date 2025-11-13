// src/controllers/dashboardController.js

const dashboardService = require("../services/dashboardService");

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getDashboardSummary();

    res.json({
      ok: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
