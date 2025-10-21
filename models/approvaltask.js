"use strict";

const { Model, DataTypes } = require("sequelize");
const ROLE_ENUM = ["STAFF", "TEAM_LEAD", "DIRECTOR", "CEO"];
const TASK_STATUS = ["WAITING", "REQUESTED", "APPROVED", "REJECTED", "AUTO_SKIPPED"];

module.exports = (sequelize) => {
  class ApprovalTask extends Model {
    static associate(models) {
      ApprovalTask.belongsTo(models.Approval, { foreignKey: "approval_id" });
      ApprovalTask.belongsTo(models.RequiredApprover, { foreignKey: "required_approver_id" });
    }
  }

  ApprovalTask.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      approval_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      required_approver_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      assignee_role_code: { type: DataTypes.ENUM(...ROLE_ENUM), allowNull: false },
      assignee_user_id: { type: DataTypes.STRING(255), allowNull: true }, // Users.id 스냅샷
      status: { type: DataTypes.ENUM(...TASK_STATUS), allowNull: false, defaultValue: "WAITING" },
      signed_at: { type: DataTypes.DATE, allowNull: true },
      signature_image_path: { type: DataTypes.TEXT, allowNull: true },
      comment: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, modelName: "ApprovalTask", tableName: "ApprovalTasks", timestamps: true, underscored: true }
  );

  return ApprovalTask;
};
