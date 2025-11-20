"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // StorageConditions 테이블에 applicable_items 컬럼 추가
    // 길이를 1000자로 설정하여 충분한 공간 확보
    await queryInterface.addColumn("StorageConditions", "applicable_items", {
      type: Sequelize.STRING(1000),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // 롤백: applicable_items 컬럼 제거
    await queryInterface.removeColumn("StorageConditions", "applicable_items");
  },
};

