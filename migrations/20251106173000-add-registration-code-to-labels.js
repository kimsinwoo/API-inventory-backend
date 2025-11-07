"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 예전에 생성된 Labels 테이블에 registration_code 컬럼이 없을 수 있어 추가합니다
    const table = "Labels";
    const column = "registration_code";

    const [results] = await queryInterface.sequelize.query(
      `SHOW COLUMNS FROM \`${table}\` LIKE '${column}';`
    );

    if (!results || results.length === 0) {
      await queryInterface.addColumn(table, column, {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: "등록번호 (item.code)",
        after: "product_name",
      });
    }
  },

  async down(queryInterface) {
    const table = "Labels";
    const column = "registration_code";
    try {
      await queryInterface.removeColumn(table, column);
    } catch (_) {
      // ignore
    }
  },
};

