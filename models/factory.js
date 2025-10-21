"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Factory extends Model {
    static associate(models) {
      Factory.hasMany(models.Items, {
        foreignKey: "factory_id",
        sourceKey: "id",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
      Factory.hasMany(models.Inventories, {
        foreignKey: "factory_id",
        sourceKey: "id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Factory.belongsTo(models.Process, {
        foreignKey: "process_id",
      });
    }
  }

  Factory.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      type: { type: DataTypes.ENUM("1PreProcessing", "2Manufacturing"), allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      address: { type: DataTypes.STRING(255) },
      process_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    },
    { sequelize, modelName: "Factory", tableName: "Factories", timestamps: true, underscored: true }
  );

  return Factory;
};
