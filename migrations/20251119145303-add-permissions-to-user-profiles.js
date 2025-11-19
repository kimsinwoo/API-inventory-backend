"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // UserProfiles 테이블에 권한 필드 추가
    await queryInterface.addColumn("UserProfiles", "can_basic_info", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "기초정보 관리 권한",
    });

    await queryInterface.addColumn("UserProfiles", "can_receiving", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "입고/검수 권한",
    });

    await queryInterface.addColumn("UserProfiles", "can_plant1_preprocess", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "1공장 전처리 권한",
    });

    await queryInterface.addColumn("UserProfiles", "can_plant_transfer", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "공장간 이동 권한",
    });

    await queryInterface.addColumn("UserProfiles", "can_plant2_manufacture", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "2공장 제조 권한",
    });

    await queryInterface.addColumn("UserProfiles", "can_shipping", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "출고관리 권한",
    });

    await queryInterface.addColumn("UserProfiles", "can_label", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "라벨관리 권한",
    });

    await queryInterface.addColumn("UserProfiles", "can_inventory", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "재고조회 권한",
    });

    await queryInterface.addColumn("UserProfiles", "can_quality", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "품질검사 권한",
    });

    await queryInterface.addColumn("UserProfiles", "can_user_management", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "사용자관리 권한",
    });
  },

  async down(queryInterface, Sequelize) {
    // 롤백: 권한 필드 제거
    await queryInterface.removeColumn("UserProfiles", "can_basic_info");
    await queryInterface.removeColumn("UserProfiles", "can_receiving");
    await queryInterface.removeColumn("UserProfiles", "can_plant1_preprocess");
    await queryInterface.removeColumn("UserProfiles", "can_plant_transfer");
    await queryInterface.removeColumn("UserProfiles", "can_plant2_manufacture");
    await queryInterface.removeColumn("UserProfiles", "can_shipping");
    await queryInterface.removeColumn("UserProfiles", "can_label");
    await queryInterface.removeColumn("UserProfiles", "can_inventory");
    await queryInterface.removeColumn("UserProfiles", "can_quality");
    await queryInterface.removeColumn("UserProfiles", "can_user_management");
  },
};

