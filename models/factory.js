"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Factory extends Model {
    static associate(models) {
      // 기존 연관 (있으면 유지)
      if (models.Items) {
        Factory.hasMany(models.Items, {
          foreignKey: "factory_id",
          sourceKey: "id",
          onDelete: "SET NULL",
          onUpdate: "CASCADE",
        });
      }
      if (models.Inventories) {
        Factory.hasMany(models.Inventories, {
          foreignKey: "factory_id",
          sourceKey: "id",
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        });
      }

      Factory.belongsToMany(models.Process, {
        through: "FactoryProcesses",
        foreignKey: "factory_id",
        otherKey: "process_id",
        as: "processes",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  Factory.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      type: { type: DataTypes.ENUM("1PreProcessing", "2Manufacturing"), allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      address: { type: DataTypes.STRING(255) },
    },
    { sequelize, modelName: "Factory", tableName: "Factories", timestamps: true, underscored: true }
  );

  return Factory;
};
