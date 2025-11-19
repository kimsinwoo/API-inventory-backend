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
      role: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, defaultValue: 1, comment: "Role ID (Roles 테이블 참조, 하위 호환성 유지)" },
      // signature_image_path: { type: DataTypes.STRING(500), allowNull: true, comment: "사용자 도장(서명) 이미지 경로" },
      // ============================
      // 사용자별 개별 권한 플래그
      // ============================
      can_basic_info: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: "기초정보 관리 권한" },
      can_receiving: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: "입고/검수 권한" },
      can_plant1_preprocess: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: "1공장 전처리 권한" },
      can_plant_transfer: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: "공장간 이동 권한" },
      can_plant2_manufacture: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: "2공장 제조 권한" },
      can_shipping: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: "출고관리 권한" },
      can_label: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: "라벨관리 권한" },
      can_inventory: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: "재고조회 권한" },
      can_quality: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: "품질검사 권한" },
      can_user_management: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: "사용자관리 권한" },
    },
    { sequelize, modelName: "UserProfile", tableName: "UserProfiles", timestamps: true, underscored: true }
  );

  return UserProfile;
};
