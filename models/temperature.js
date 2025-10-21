"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Temperature extends Model {
    static associate(models) {
      Temperature.belongsTo(models.User, { foreignKey: "inspector" });
    }
  }

  Temperature.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      storage_type: { type: DataTypes.ENUM("coldStorage", "freezer"), allowNull: false },
      temp: { type: DataTypes.FLOAT, allowNull: false },
      inspector: { type: DataTypes.STRING(255), allowNull: false },
      profile_id: { type: DataTypes.STRING(255), allowNull: false },
    },
    { sequelize, modelName: "Temperature", tableName: "Temperature", timestamps: true, underscored: true }
  );

  return Temperature;
};
