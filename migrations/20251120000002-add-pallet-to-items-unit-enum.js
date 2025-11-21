"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Items 테이블의 unit ENUM에 'pallet' 추가
    // MySQL에서 ENUM을 변경하려면 ALTER TABLE을 사용해야 합니다
    await queryInterface.sequelize.query(`
      ALTER TABLE Items 
      MODIFY COLUMN unit ENUM('kg', 'g', 'L', 'EA', 'BOX', 'PCS', 'ROLL', 'pallet') 
      NOT NULL DEFAULT 'kg';
    `);
  },

  async down(queryInterface, Sequelize) {
    // 롤백: 'pallet' 제거
    await queryInterface.sequelize.query(`
      ALTER TABLE Items 
      MODIFY COLUMN unit ENUM('kg', 'g', 'L', 'EA', 'BOX', 'PCS', 'ROLL') 
      NOT NULL DEFAULT 'kg';
    `);
  },
};

