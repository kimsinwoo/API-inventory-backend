"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // StorageConditions 테이블의 applicable_items 컬럼 길이를 100에서 1000으로 변경
    await queryInterface.changeColumn("StorageConditions", "applicable_items", {
      type: Sequelize.STRING(1000),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // 롤백: applicable_items 컬럼 길이를 100으로 되돌림
    await queryInterface.changeColumn("StorageConditions", "applicable_items", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },
};

