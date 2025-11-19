"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Role extends Model {
    static associate(models) {
      // UserRole 모델이 존재하는 경우에만 관계 설정
      if (models.UserRole) {
        // Role 1 : N UserRole
        Role.hasMany(models.UserRole, {
          foreignKey: "role_id",
          as: "userRoles",
        });

        // Role N : M User (through UserRole)
        Role.belongsToMany(models.User, {
          through: models.UserRole,
          foreignKey: "role_id",
          otherKey: "user_id",
          as: "users",
        });
      }

      // RolePermission 모델이 존재하는 경우에만 관계 설정
      if (models.RolePermission) {
        // Role 1 : N RolePermission
        Role.hasMany(models.RolePermission, {
          foreignKey: "role_id",
          as: "rolePermissions",
        });
      }
    }
  }

  Role.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        // 예: "ADMIN", "MANAGER", "STAFF"
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      display_name: {
        // 화면용 한글명: "관리자", "창고 담당자" 등
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      is_system: {
        // 시스템 기본 역할 여부 (삭제 방지용)
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_default: {
        // 신규 사용자에게 기본으로 부여할 역할인지
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // ============================
      // 권한 플래그 (메뉴 단위)
      // ============================
      // 기초정보 관리
      can_basic_info: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 입고/검수
      can_receiving: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 1공장 전처리
      can_plant1_preprocess: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 공장간 이동
      can_plant_transfer: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 2공장 제조
      can_plant2_manufacture: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 출고관리
      can_shipping: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 라벨관리
      can_label: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 재고조회
      can_inventory: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 품질검사
      can_quality: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 사용자관리
      can_user_management: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Role",
      tableName: "Roles",
      underscored: true,
      timestamps: true,
    }
  );

  return Role;
};
