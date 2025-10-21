"use strict";

const { Model, DataTypes } = require("sequelize");
const ROLE_ENUM = ["STAFF", "TEAM_LEAD", "DIRECTOR", "CEO"];

module.exports = (sequelize) => {
  class RequiredApprover extends Model {
    static associate(models) {
      // 필요 시 FormType 대신 form_code를 키로 사용: Approval.form_code와 매칭
      // (DB 레벨 FK는 문자열이라 보통 어플리케이션 레벨에서 조인)
      RequiredApprover.hasMany(models.ApprovalTask, { foreignKey: "required_approver_id" });
    }
  }

  RequiredApprover.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      form_code: { type: DataTypes.STRING(50), allowNull: false }, // Approval.form_code 기준
      order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      role_code: { type: DataTypes.ENUM(...ROLE_ENUM), allowNull: false },
      required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      conditions: { type: DataTypes.JSON, allowNull: true },     // { amount:{gte:500000}, category:['소모품'] ... }
      parallel_group_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    },
    { sequelize, modelName: "RequiredApprover", tableName: "RequiredApprovers", timestamps: true, underscored: true }
  );

  return RequiredApprover;
};
