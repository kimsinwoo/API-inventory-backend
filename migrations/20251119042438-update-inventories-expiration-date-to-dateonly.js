'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Inventories 테이블의 expiration_date 컬럼 타입을 INTEGER에서 DATE로 변경
    // Sequelize의 DATEONLY는 MySQL의 DATE 타입으로 매핑됩니다
    await queryInterface.changeColumn('Inventories', 'expiration_date', {
      type: Sequelize.DATEONLY,
      allowNull: false,
      comment: '유통기한 날짜',
    });
  },

  async down(queryInterface, Sequelize) {
    // 롤백: DATEONLY를 INTEGER로 되돌림
    // 주의: 기존 날짜 데이터는 손실될 수 있습니다
    await queryInterface.changeColumn('Inventories', 'expiration_date', {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '유통기한 (first_received_at + 품목.expiration_date 일수)',
    });
  }
};
