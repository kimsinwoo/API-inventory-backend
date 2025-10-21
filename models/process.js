"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Process extends Model {
    static associate(models) {
      Process.hasMany(models.Factory, {
        foreignKey: "process_id",
        sourceKey: "id",
      });
    }
  }

  Process.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
    },
    { sequelize, modelName: "Process", tableName: "Processes", timestamps: true, underscored: true }
  );

  return Process;
};
