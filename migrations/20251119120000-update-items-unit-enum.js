"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Items 테이블의 unit ENUM을 업데이트
    // MySQL에서 ENUM을 변경하려면 ALTER TABLE을 사용해야 합니다
    await queryInterface.sequelize.query(`
      ALTER TABLE Items 
      MODIFY COLUMN unit ENUM('kg', 'g', 'L', 'EA', 'BOX', 'PCS', 'ROLL') 
      NOT NULL DEFAULT 'kg';
    `);
  },

  async down(queryInterface, Sequelize) {
    // 롤백: 원래 ENUM으로 되돌림 (L과 ROLL 제거)
    await queryInterface.sequelize.query(`
      ALTER TABLE Items 
      MODIFY COLUMN unit ENUM('kg', 'g', 'EA', 'BOX', 'PCS') 
      NOT NULL DEFAULT 'kg';
    `);
  },
};

