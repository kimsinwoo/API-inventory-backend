"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.UserProfile, { 
        foreignKey: "profile_id",
        as: "UserProfile"
      });
      User.hasMany(models.Position, { 
        foreignKey: "user_id",
        as: "Positions"
      });
    }
  }

  User.init(
    {
      id: { type: DataTypes.STRING(255), primaryKey: true },
      password: { type: DataTypes.STRING(255), allowNull: false },
      profile_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    },
    { sequelize, modelName: "User", tableName: "Users", timestamps: true, underscored: true }
  );

  return User;
};
