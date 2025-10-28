/**
 * 리포트 컨트롤러
 */
const reportService = require("../services/reportService");
const path = require("path");

/**
 * 일일 리포트
 */
exports.getDailyReport = async (req, res, next) => {
  try {
    const { date, factoryId, export: shouldExport } = req.query;
    const report = await reportService.generateDailyReport(date, factoryId);

    if (shouldExport === "true") {
      const file = await reportService.exportToExcel("daily", report);
      return res.json({
        ok: true,
        message: "리포트가 생성되었습니다",
        data: report,
        file,
      });
    }

    res.json({
      ok: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 주간 리포트
 */
exports.getWeeklyReport = async (req, res, next) => {
  try {
    const { weekStart, factoryId, export: shouldExport } = req.query;
    const report = await reportService.generateWeeklyReport(weekStart, factoryId);

    if (shouldExport === "true") {
      const file = await reportService.exportToExcel("weekly", report);
      return res.json({
        ok: true,
        message: "리포트가 생성되었습니다",
        data: report,
        file,
      });
    }

    res.json({
      ok: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 월간 리포트
 */
exports.getMonthlyReport = async (req, res, next) => {
  try {
    const { year, month, factoryId, export: shouldExport } = req.query;
    const report = await reportService.generateMonthlyReport(
      year,
      month,
      factoryId
    );

    if (shouldExport === "true") {
      const file = await reportService.exportToExcel("monthly", report);
      return res.json({
        ok: true,
        message: "리포트가 생성되었습니다",
        data: report,
        file,
      });
    }

    res.json({
      ok: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 재고 현황 리포트
 */
exports.getInventoryStatusReport = async (req, res, next) => {
  try {
    const { factoryId, export: shouldExport } = req.query;
    const report = await reportService.generateInventoryStatusReport(factoryId);

    if (shouldExport === "true") {
      const file = await reportService.exportToExcel("inventory", report);
      return res.json({
        ok: true,
        message: "리포트가 생성되었습니다",
        data: report,
        file,
      });
    }

    res.json({
      ok: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 재고 회전율 분석
 */
exports.getTurnoverAnalysis = async (req, res, next) => {
  try {
    const { factoryId, days = 30 } = req.query;
    const analysis = await reportService.analyzeInventoryTurnover(
      factoryId,
      parseInt(days)
    );

    res.json({
      ok: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 리포트 파일 다운로드
 */
exports.downloadReport = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(
      __dirname,
      "../../uploads/reports",
      filename
    );

    const fs = require("fs");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        ok: false,
        message: "파일을 찾을 수 없습니다",
      });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("파일 다운로드 오류:", err);
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 생성된 리포트 목록
 */
exports.listReports = async (req, res, next) => {
  try {
    const fs = require("fs");
    const reportsDir = path.join(__dirname, "../../uploads/reports");

    if (!fs.existsSync(reportsDir)) {
      return res.json({
        ok: true,
        data: [],
      });
    }

    const files = fs.readdirSync(reportsDir);
    const reportFiles = files
      .filter((file) => file.endsWith(".xlsx"))
      .map((file) => {
        const stats = fs.statSync(path.join(reportsDir, file));
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          downloadUrl: `/api/reports/download/${file}`,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      ok: true,
      data: reportFiles,
      count: reportFiles.length,
    });
  } catch (error) {
    next(error);
  }
};

