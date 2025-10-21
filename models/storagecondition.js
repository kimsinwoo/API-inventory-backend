"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class StorageCondition extends Model {
    static associate(models) {
      StorageCondition.hasMany(models.Items, {
        foreignKey: "storage_condition_id",
        sourceKey: "id",
      });
      StorageCondition.hasMany(models.Inventories, {
        foreignKey: "storage_condition_id",
        sourceKey: "id",
      });
    }
  }

  StorageCondition.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(50), allowNull: false },
      temperature_range: { type: DataTypes.STRING(50) },
      humidity_range: { type: DataTypes.STRING(50) },
    },
    {
      sequelize,
      modelName: "StorageCondition",
      tableName: "StorageConditions",
      timestamps: true,
      underscored: true,
    }
  );

  return StorageCondition;
};
