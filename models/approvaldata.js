"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ApprovalData extends Model {
    static associate(models) {
      ApprovalData.belongsTo(models.Approval, { foreignKey: "approval_id" });
    }
  }

  ApprovalData.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      approval_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
      payload: { type: DataTypes.JSON, allowNull: false },
    },
    { sequelize, modelName: "ApprovalData", tableName: "ApprovalData", timestamps: true, underscored: true }
  );

  return ApprovalData;
};
