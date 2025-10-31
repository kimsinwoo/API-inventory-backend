"use strict";

const { Model, DataTypes } = require("sequelize");

const TRANSACTION_TYPE_ENUM = ["RECEIVE", "ISSUE"];
const PLANNED_STATUS_ENUM = ["PENDING", "APPROVED", "COMPLETED", "CANCELLED"];

module.exports = (sequelize) => {
  class PlannedTransaction extends Model {
    static associate(models) {
      PlannedTransaction.belongsTo(models.Items, { foreignKey: "item_id" });
      PlannedTransaction.belongsTo(models.Factory, { foreignKey: "factory_id" });
      PlannedTransaction.belongsTo(models.StorageCondition, { foreignKey: "storage_condition_id" });
      PlannedTransaction.belongsTo(models.User, { as: "RequestedBy", foreignKey: "requested_by_user_id" });
      PlannedTransaction.belongsTo(models.User, { as: "ApprovedBy", foreignKey: "approved_by_user_id" });
      PlannedTransaction.belongsTo(models.User, { as: "CompletedBy", foreignKey: "completed_by_user_id" });
    }
  }

  PlannedTransaction.init(
    {
      id: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        autoIncrement: true, 
        primaryKey: true 
      },
      transaction_type: { 
        type: DataTypes.ENUM(...TRANSACTION_TYPE_ENUM), 
        allowNull: false,
        comment: "RECEIVE: 입고 예정, ISSUE: 출고 예정"
      },
      item_id: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        allowNull: false 
      },
      factory_id: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        allowNull: false 
      },
      quantity: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
      },
      unit: { 
        type: DataTypes.STRING(10), 
        allowNull: false 
      },
      status: { 
        type: DataTypes.ENUM(...PLANNED_STATUS_ENUM), 
        allowNull: false, 
        defaultValue: "PENDING",
        comment: "PENDING: 대기, APPROVED: 승인됨, COMPLETED: 완료, CANCELLED: 취소"
      },
      scheduled_date: { 
        type: DataTypes.DATE, 
        allowNull: false,
        comment: "예정일"
      },
      requested_by_user_id: { 
        type: DataTypes.STRING(255), 
        allowNull: false,
        comment: "요청자 ID"
      },
      approved_by_user_id: { 
        type: DataTypes.STRING(255), 
        allowNull: true,
        comment: "승인자 ID"
      },
      completed_by_user_id: { 
        type: DataTypes.STRING(255), 
        allowNull: true,
        comment: "완료 처리자 ID"
      },
      approved_at: { 
        type: DataTypes.DATE, 
        allowNull: true 
      },
      completed_at: { 
        type: DataTypes.DATE, 
        allowNull: true 
      },
      // 입고용 필드
      supplier_name: { 
        type: DataTypes.STRING(100), 
        allowNull: true,
        comment: "공급업체명 (입고용)"
      },
      barcode: { 
        type: DataTypes.STRING(14), 
        allowNull: true,
        comment: "14자리 유니크 바코드 (입고 예정 시 미리 생성 가능)"
      },
      wholesale_price: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: true,
        comment: "도매가 (입고용)"
      },
      storage_condition_id: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        allowNull: true,
        comment: "보관 조건 ID (입고용)"
      },
      // 출고용 필드
      customer_name: { 
        type: DataTypes.STRING(100), 
        allowNull: true,
        comment: "고객명 (출고용)"
      },
      issue_type: { 
        type: DataTypes.ENUM("PRODUCTION", "SHIPPING", "DAMAGE", "OTHER"), 
        allowNull: true,
        defaultValue: "OTHER",
        comment: "출고 유형"
      },
      shipping_address: { 
        type: DataTypes.STRING(200), 
        allowNull: true,
        comment: "배송지 (출고용)"
      },
      // 공통 필드
      notes: { 
        type: DataTypes.TEXT, 
        allowNull: true,
        comment: "비고"
      },
      rejection_reason: { 
        type: DataTypes.TEXT, 
        allowNull: true,
        comment: "거부 사유 (CANCELLED 상태일 때)"
      },
    },
    { 
      sequelize, 
      modelName: "PlannedTransaction", 
      tableName: "PlannedTransactions", 
      timestamps: true, 
      underscored: true,
      indexes: [
        { fields: ["transaction_type"] },
        { fields: ["status"] },
        { fields: ["scheduled_date"] },
        { fields: ["item_id"] },
        { fields: ["factory_id"] },
      ]
    }
  );

  return PlannedTransaction;
};


