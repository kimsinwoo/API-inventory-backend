"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Position extends Model {
    static associate(models) {
      Position.belongsTo(models.User, { foreignKey: "user_id" });
    }
  }

  Position.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.STRING(255), allowNull: false },
      title: { type: DataTypes.STRING(50), allowNull: false },
      level: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    },
    { sequelize, modelName: "Position", tableName: "Positions", timestamps: true, underscored: true }
  );

  return Position;
};
