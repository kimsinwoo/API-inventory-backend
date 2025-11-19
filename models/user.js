"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // UserRole 모델이 존재하는 경우에만 관계 설정
      if (models.UserRole) {
        // User 1 : N UserRole
        User.hasMany(models.UserRole, {
          foreignKey: "user_id",
          as: "userRoles",
        });

        // User N : M Role (through UserRole)
        User.belongsToMany(models.Role, {
          through: models.UserRole,
          foreignKey: "user_id",
          otherKey: "role_id",
          as: "roles",
        });
      }

      // 기존 연관관계 유지
      if (models.UserProfile) {
        User.belongsTo(models.UserProfile, { 
          foreignKey: "profile_id",
          as: "UserProfile",
        });
      }
      
      if (models.Position) {
        User.hasMany(models.Position, { 
          foreignKey: "user_id",
          as: "Positions",
        });
      }
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.STRING(255),
        primaryKey: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      profile_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      // 추가 필드 예시 (role.js 참고. 불필요하면 제외 가능)
      /*
      display_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      */
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
      underscored: true,
      timestamps: true,
    }
  );

  return User;
};
