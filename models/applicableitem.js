"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ApplicableItem extends Model {
    static associate(models) {
      ApplicableItem.hasMany(models.StorageCondition, {
        foreignKey: "applicable_item_id",
        sourceKey: "id",
      });
    }
  }

  ApplicableItem.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      shelf_life: { type: DataTypes.INTEGER.UNSIGNED },
      unit: { type: DataTypes.STRING(20) },
    },
    { sequelize, modelName: "ApplicableItem", tableName: "ApplicableItems", timestamps: true, underscored: true }
  );

  return ApplicableItem;
};
