// src/services/dashboardService.js

const dayjs = require("dayjs");
const { Op } = require("sequelize");
const models = require("../../models"); // <-- 여기 하나만 사용

const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

// 모델 이름(string)으로 안전하게 count 호출
const safeCount = async (modelName, options) => {
  const model = models[modelName];
  if (!model || typeof model.count !== "function") {
    console.error(
      "[DASHBOARD] safeCount: model이 없거나 count 없음 ->",
      modelName,
    );
    return 0;
  }
  return model.count(options);
};

exports.getDashboardSummary = async () => {
  const now = dayjs().tz("Asia/Seoul");
  const startOfToday = now.startOf("day").toDate();
  const endOfToday = now.endOf("day").toDate();

  // 병렬 실행
  const [
    todayReceiveCompletedCount,
    todayManufactureCompletedCount,
    todayShippingCompletedCount,
    stockAlertCount,
    expireSoonCount,
    approvalPendingCount,
  ] = await Promise.all([
    // 1) 오늘 입고 완료: PlannedTransaction, RECEIVE + COMPLETED
    safeCount("PlannedTransaction", {
      where: {
        transaction_type: "RECEIVE",
        status: "COMPLETED",
        completed_at: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    }),

    // 2) 오늘 제조 완료: WorkOrder, COMPLETED + scheduled_end_date 오늘
    safeCount("WorkOrder", {
      where: {
        status: "COMPLETED",
        scheduled_end_date: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    }),

    // 3) 오늘 출고 완료: PlannedTransaction, ISSUE + COMPLETED
    safeCount("PlannedTransaction", {
      where: {
        transaction_type: "ISSUE", // 프로젝트에 맞게 유지
        status: "COMPLETED",
        completed_at: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    }),

    // 4) 재고 알람: Inventories.status = 'LowStock'
    safeCount("Inventories", {
      where: {
        status: "LowStock",
      },
    }),

    // 5) 유통기한 임박: Inventories.status = 'Expiring'
    //   (원하면 'Expired' 도 같이 포함 가능)
    safeCount("Inventories", {
      where: {
        status: {
          [Op.in]: ["Expiring"], // ["Expiring", "Expired"] 로 바꿔도 됨
        },
      },
    }),

    // 6) 승인 대기: ApprovalTask.status = 'PENDING'
    safeCount("ApprovalTask", {
      where: {
        status: "PENDING",
      },
    }),
  ]);

  return {
    "입고 완료": {
      today: todayReceiveCompletedCount,
    },
    "제조 완료": {
      today: todayManufactureCompletedCount,
    },
    "출고 완료": {
      today: todayShippingCompletedCount,
    },
    "재고 알람": {
      count: stockAlertCount,
    },
    "유통기한 임박": {
      count: expireSoonCount,
      // daysThreshold 넣고 싶으면 여기 추가
    },
    "승인 대기": {
      count: approvalPendingCount,
    },
  };
};
