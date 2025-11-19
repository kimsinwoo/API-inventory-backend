"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class UserProfile extends Model {
    static associate(models) {
      UserProfile.hasOne(models.User, { 
        foreignKey: "profile_id",
        as: "User"
      });
      
      // Role과의 관계 추가
      if (models.Role) {
        UserProfile.belongsTo(models.Role, {
          foreignKey: "role",
          targetKey: "id",
          as: "Role",
        });
      }
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
      role: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, defaultValue: 1, comment: "Role ID (Roles 테이블 참조)" },
      // signature_image_path: { type: DataTypes.STRING(500), allowNull: true, comment: "사용자 도장(서명) 이미지 경로" },
    },
    { sequelize, modelName: "UserProfile", tableName: "UserProfiles", timestamps: true, underscored: true }
  );

  return UserProfile;
};
