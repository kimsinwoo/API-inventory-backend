'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Factory 테이블의 type ENUM에 'Warehouse' 추가
    await queryInterface.sequelize.query(
      `ALTER TABLE Factories MODIFY COLUMN type ENUM('1PreProcessing', '2Manufacturing', 'Warehouse') NOT NULL;`
    );
  },

  async down(queryInterface, Sequelize) {
    // 롤백: Warehouse 타입 제거
    await queryInterface.sequelize.query(
      `ALTER TABLE Factories MODIFY COLUMN type ENUM('1PreProcessing', '2Manufacturing') NOT NULL;`
    );
  }
};

