"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class BOM extends Model {
    static associate(models) {
      BOM.hasMany(models.BOMComponent, {
        foreignKey: "bom_id",
        as: "components",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      BOM.hasMany(models.Items, { foreignKey: "bom_id", as: "products" });
    }
  }

  BOM.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },  
      description: { type: DataTypes.STRING(255) },
    },
    { sequelize, modelName: "BOM", tableName: "BOMs", timestamps: true, underscored: true }
  );

  return BOM;
};
