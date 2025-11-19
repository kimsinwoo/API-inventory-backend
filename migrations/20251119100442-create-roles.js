"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Roles", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      // 시스템에서 사용할 역할 코드 (예: ADMIN, MANAGER, PLANT1_STAFF)
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      // 화면에 보여줄 한글 이름 (예: "관리자", "1공장 전처리 담당")
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_system: {
        // 시스템 기본 역할 여부 (삭제/수정 제한용)
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_default: {
        // 신규 사용자에게 기본으로 부여할 역할인지 여부
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      // ============================
      // 권한 플래그 (메뉴 단위)
      // ============================

      // 기초정보 관리
      can_basic_info: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 입고/검수
      can_receiving: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 1공장 전처리
      can_plant1_preprocess: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 공장간 이동
      can_plant_transfer: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 2공장 제조
      can_plant2_manufacture: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 출고관리
      can_shipping: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 라벨관리
      can_label: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 재고조회
      can_inventory: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 품질검사
      can_quality: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 사용자관리
      can_user_management: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Roles");
  },
};
