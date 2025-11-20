"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // StorageConditions 테이블에 applicable_items 컬럼 추가
    await queryInterface.addColumn("StorageConditions", "applicable_items", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // 롤백: applicable_items 컬럼 제거
    await queryInterface.removeColumn("StorageConditions", "applicable_items");
  },
};

