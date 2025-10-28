/**
 * 배치 작업 스케줄러 서비스
 * 주기적인 작업 수행 (알림, 리포트, 상태 업데이트 등)
 */

const notificationService = require("./notificationService");
const reportService = require("./reportService");
const db = require("../../models");
const { Inventories } = db;
const { Op } = require("sequelize");
const dayjs = require("dayjs");

/**
 * 재고 상태 자동 업데이트
 * 유통기한 기준으로 상태 갱신
 */
exports.updateInventoryStatus = async () => {
  console.log("[스케줄러] 재고 상태 업데이트 시작...");

  try {
    const today = dayjs().startOf("day");

    // 만료된 재고
    const expiredCount = await Inventories.update(
      { status: "Expired" },
      {
        where: {
          expiration_date: { [Op.lt]: today.format("YYYY-MM-DD") },
          status: { [Op.ne]: "Expired" },
        },
      }
    );

    // 유통기한 임박 (3일 이내)
    const expiringCount = await Inventories.update(
      { status: "Expiring" },
      {
        where: {
          expiration_date: {
            [Op.between]: [
              today.format("YYYY-MM-DD"),
              today.add(3, "day").format("YYYY-MM-DD"),
            ],
          },
          status: { [Op.notIn]: ["Expired", "Expiring"] },
        },
      }
    );

    console.log(
      `[스케줄러] 재고 상태 업데이트 완료 - 만료: ${expiredCount[0]}건, 임박: ${expiringCount[0]}건`
    );

    return {
      expired: expiredCount[0],
      expiring: expiringCount[0],
      timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };
  } catch (error) {
    console.error("[스케줄러] 재고 상태 업데이트 실패:", error);
    throw error;
  }
};

/**
 * 일일 알림 전송
 */
exports.sendDailyAlerts = async () => {
  console.log("[스케줄러] 일일 알림 생성 시작...");

  try {
    const alertReport = await notificationService.generateDailyAlertReport();

    // 실제로는 이메일이나 메시징 서비스로 전송
    console.log("[스케줄러] 일일 알림 요약:");
    console.log(`  - 총 알림: ${alertReport.summary.totalAlerts}건`);
    console.log(`  - 재고 부족: ${alertReport.summary.lowStock}건`);
    console.log(`  - 유통기한 임박: ${alertReport.summary.expiring}건`);
    console.log(`  - 유통기한 만료: ${alertReport.summary.expired}건`);

    if (alertReport.recommendations.length > 0) {
      console.log("[스케줄러] 권장 사항:");
      alertReport.recommendations.forEach((rec) => {
        console.log(`  - [${rec.type}] ${rec.message}`);
      });
    }

    return alertReport;
  } catch (error) {
    console.error("[스케줄러] 일일 알림 생성 실패:", error);
    throw error;
  }
};

/**
 * 일일 리포트 자동 생성
 */
exports.generateDailyReports = async () => {
  console.log("[스케줄러] 일일 리포트 생성 시작...");

  try {
    const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    const report = await reportService.generateDailyReport(yesterday);

    // Excel 파일로 저장
    const file = await reportService.exportToExcel(
      "daily",
      report,
      `daily_report_${yesterday}.xlsx`
    );

    console.log(`[스케줄러] 일일 리포트 생성 완료: ${file.fileName}`);

    return {
      report,
      file,
    };
  } catch (error) {
    console.error("[스케줄러] 일일 리포트 생성 실패:", error);
    throw error;
  }
};

/**
 * 주간 리포트 자동 생성 (매주 월요일)
 */
exports.generateWeeklyReports = async () => {
  console.log("[스케줄러] 주간 리포트 생성 시작...");

  try {
    const lastWeek = dayjs().subtract(1, "week").startOf("week");
    const report = await reportService.generateWeeklyReport(
      lastWeek.format("YYYY-MM-DD")
    );

    const file = await reportService.exportToExcel(
      "weekly",
      report,
      `weekly_report_${lastWeek.format("YYYYMMDD")}.xlsx`
    );

    console.log(`[스케줄러] 주간 리포트 생성 완료: ${file.fileName}`);

    return {
      report,
      file,
    };
  } catch (error) {
    console.error("[스케줄러] 주간 리포트 생성 실패:", error);
    throw error;
  }
};

/**
 * 월간 리포트 자동 생성 (매월 1일)
 */
exports.generateMonthlyReports = async () => {
  console.log("[스케줄러] 월간 리포트 생성 시작...");

  try {
    const lastMonth = dayjs().subtract(1, "month");
    const year = lastMonth.year();
    const month = lastMonth.month() + 1;

    const report = await reportService.generateMonthlyReport(year, month);

    const file = await reportService.exportToExcel(
      "monthly",
      report,
      `monthly_report_${year}_${String(month).padStart(2, "0")}.xlsx`
    );

    console.log(`[스케줄러] 월간 리포트 생성 완료: ${file.fileName}`);

    return {
      report,
      file,
    };
  } catch (error) {
    console.error("[스케줄러] 월간 리포트 생성 실패:", error);
    throw error;
  }
};

/**
 * 재고 정리 (만료된 지 오래된 기록 삭제)
 */
exports.cleanupExpiredInventory = async (daysOld = 90) => {
  console.log("[스케줄러] 만료 재고 정리 시작...");

  try {
    const threshold = dayjs()
      .subtract(daysOld, "day")
      .format("YYYY-MM-DD");

    const deletedCount = await Inventories.destroy({
      where: {
        status: "Expired",
        quantity: 0,
        expiration_date: {
          [Op.lt]: threshold,
        },
      },
    });

    console.log(
      `[스케줄러] 만료 재고 정리 완료: ${deletedCount}건 삭제`
    );

    return {
      deleted: deletedCount,
      threshold,
      timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };
  } catch (error) {
    console.error("[스케줄러] 만료 재고 정리 실패:", error);
    throw error;
  }
};

/**
 * 전체 스케줄 작업 실행 (테스트용)
 */
exports.runAllJobs = async () => {
  console.log("[스케줄러] 모든 배치 작업 실행 시작...");

  const results = {
    startTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    jobs: {},
  };

  try {
    // 재고 상태 업데이트
    results.jobs.updateStatus = await exports.updateInventoryStatus();

    // 일일 알림
    results.jobs.dailyAlerts = await exports.sendDailyAlerts();

    // 일일 리포트
    results.jobs.dailyReport = await exports.generateDailyReports();

    console.log("[스케줄러] 모든 배치 작업 완료");
  } catch (error) {
    console.error("[스케줄러] 배치 작업 중 오류 발생:", error);
    results.error = error.message;
  }

  results.endTime = dayjs().format("YYYY-MM-DD HH:mm:ss");

  return results;
};

/**
 * 스케줄러 초기화 및 실행
 * 실제 프로덕션에서는 node-cron, bull, agenda 등의 라이브러리 사용 권장
 */
exports.initScheduler = () => {
  console.log("[스케줄러] 초기화 시작...");

  // 매일 오전 2시 - 재고 상태 업데이트
  setInterval(
    async () => {
      await exports.updateInventoryStatus();
    },
    24 * 60 * 60 * 1000
  ); // 24시간

  // 매일 오전 8시 - 일일 알림 및 리포트
  setInterval(
    async () => {
      await exports.sendDailyAlerts();
      await exports.generateDailyReports();
    },
    24 * 60 * 60 * 1000
  ); // 24시간

  console.log("[스케줄러] 초기화 완료");
  console.log("  - 재고 상태 업데이트: 매일 실행");
  console.log("  - 일일 알림/리포트: 매일 실행");
};

