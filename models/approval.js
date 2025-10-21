"use strict";

const { Model, DataTypes } = require("sequelize");
const REQUEST_STATUS = ["PENDING", "IN_PROGRESS", "REJECTED", "APPROVED", "EXPORTED"];

module.exports = (sequelize) => {
  class Approval extends Model {
    static associate(models) {
      Approval.hasMany(models.ApprovalTask, { foreignKey: "approval_id" });
      Approval.hasMany(models.Attachment, { foreignKey: "approval_id" });
      Approval.hasOne(models.ApprovalData, { foreignKey: "approval_id" });
      // 필요 시: Approval.belongsTo(models.User, { foreignKey: "created_by_user_id" });
    }
  }

  Approval.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      form_code: { type: DataTypes.STRING(50), allowNull: false },      // "서식 코드" (운영 데이터로 제어)
      created_by_user_id: { type: DataTypes.STRING(255), allowNull: false }, // Users.id
      status: { type: DataTypes.ENUM(...REQUEST_STATUS), allowNull: false, defaultValue: "PENDING" },
      current_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      title: { type: DataTypes.STRING(200), allowNull: true },
    },
    { sequelize, modelName: "Approval", tableName: "Approvals", timestamps: true, underscored: true }
  );

  return Approval;
};
