"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.Approval, { foreignKey: "approval_id" });
      AuditLog.belongsTo(models.ApprovalTask, { foreignKey: "approval_task_id" });
    }
  }

  AuditLog.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      approval_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      approval_task_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      actor_user_id: { type: DataTypes.STRING(255), allowNull: true },
      action: { type: DataTypes.STRING(50), allowNull: false }, // TASK_REQUESTED / TASK_APPROVED / AUTO_SKIPPED ...
      detail: { type: DataTypes.JSON, allowNull: true },
    },
    { sequelize, modelName: "AuditLog", tableName: "AuditLogs", timestamps: true, underscored: true }
  );

  return AuditLog;
};
