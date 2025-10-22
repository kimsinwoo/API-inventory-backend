"use strict";

const { Model, DataTypes } = require("sequelize");
const ROLE_ENUM = ["STAFF", "TEAM_LEAD", "DIRECTOR", "CEO"];

module.exports = (sequelize) => {
  class RequiredApprover extends Model {
    static associate(models) {
      RequiredApprover.hasMany(models.ApprovalTask, { foreignKey: "required_approver_id" });
    }
  }

  RequiredApprover.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      form_code: { type: DataTypes.STRING(50), allowNull: false }, 
      order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      role_code: { type: DataTypes.ENUM(...ROLE_ENUM), allowNull: false },
      required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      conditions: { type: DataTypes.JSON, allowNull: true },     
      parallel_group_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    },
    { sequelize, modelName: "RequiredApprover", tableName: "RequiredApprovers", timestamps: true, underscored: true }
  );

  return RequiredApprover;
};
