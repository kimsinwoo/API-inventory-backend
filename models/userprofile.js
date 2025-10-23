"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class UserProfile extends Model {
    static associate(models) {
      UserProfile.hasOne(models.User, { foreignKey: "profile_id" });
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
      // 부서,
      // 권한 //예시) 1은 
    },
    { sequelize, modelName: "UserProfile", tableName: "UserProfiles", timestamps: true, underscored: true }
  );

  return UserProfile;
};
