"use strict";

const { Model, DataTypes } = require("sequelize");
const ATTACH_KIND = ["source_csv", "pdf", "other"];

module.exports = (sequelize) => {
  class Attachment extends Model {
    static associate(models) {
      Attachment.belongsTo(models.Approval, { foreignKey: "approval_id" });
    }
  }

  Attachment.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      approval_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      kind: { type: DataTypes.ENUM(...ATTACH_KIND), allowNull: false },
      path: { type: DataTypes.STRING(500), allowNull: false },
      original_name: { type: DataTypes.STRING(255), allowNull: true },
      meta: { type: DataTypes.JSON, allowNull: true },
    },
    { sequelize, modelName: "Attachment", tableName: "Attachments", timestamps: true, underscored: true }
  );

  return Attachment;
};
