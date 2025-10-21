"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class BOM extends Model {
    static associate(models) {
      BOM.hasMany(models.Items, {
        foreignKey: "bom_id",
        sourceKey: "id",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    }
  }

  BOM.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      description: { type: DataTypes.STRING(255) },
    },
    { sequelize, modelName: "BOM", tableName: "BOMs", timestamps: true, underscored: true }
  );

  return BOM;
};
