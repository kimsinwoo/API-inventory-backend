"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class WorkOrder extends Model {
    static associate(models) {
      WorkOrder.belongsTo(models.Items, { foreignKey: "product_item_id", as: "product" });
      WorkOrder.belongsTo(models.BOM, { foreignKey: "bom_id", as: "bom" });
      WorkOrder.belongsTo(models.Factory, { foreignKey: "factory_id", as: "factory" });
      WorkOrder.belongsTo(models.User, { foreignKey: "created_by_user_id", as: "creator" });
      WorkOrder.belongsTo(models.User, { foreignKey: "completed_by_user_id", as: "completor" });
    }
  }

  WorkOrder.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      work_order_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: "작업 지시서 번호 (예: WO-20251030-001)",
      },
      product_item_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: "생산할 완제품 ID",
      },
      bom_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: "사용할 BOM ID",
      },
      factory_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: "생산 공장 ID",
      },
      planned_quantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        comment: "계획 생산 수량",
      },
      actual_quantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: true,
        comment: "실제 생산 수량",
      },
      unit: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      scheduled_start_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "생산 예정 시작일",
      },
      scheduled_end_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "생산 예정 완료일",
      },
      actual_start_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "실제 시작일",
      },
      actual_end_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "실제 완료일",
      },
      created_by_user_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      completed_by_user_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "WorkOrder",
      tableName: "WorkOrders",
      timestamps: true,
      underscored: true,
    }
  );

  return WorkOrder;
};


