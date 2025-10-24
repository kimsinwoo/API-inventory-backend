"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class UserProfile extends Model {
    static associate(models) {
      UserProfile.hasOne(models.User, { 
        foreignKey: "profile_id",
        as: "User"
      });
    }
  }

  UserProfile.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      full_name: { type: DataTypes.STRING(100), allowNull: false },
      phone_number: { type: DataTypes.STRING(30), allowNull: false },
      email: { type: DataTypes.STRING(100), allowNull: false },
      hire_date: { type: DataTypes.DATEONLY, allowNull: true },
      position: { type: DataTypes.STRING(50), allowNull: true },
      department: { type: DataTypes.STRING(50), allowNull: true },
      role: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 }, // 1: 직원, 2: 팀장, 3: 이사, 4: CEO 등
    },
    { sequelize, modelName: "UserProfile", tableName: "UserProfiles", timestamps: true, underscored: true }
  );

  return UserProfile;
};
