"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // html_content 컬럼이 이미 존재하는지 확인 (MySQL 호환)
    try {
      const [results] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM \`LabelTemplates\` LIKE 'html_content';`
      );
      
      if (results && results.length > 0) {
        // 컬럼이 이미 존재하면 allowNull을 true로 변경
        await queryInterface.changeColumn("LabelTemplates", "html_content", {
          type: Sequelize.TEXT("long"),
          allowNull: true,
        });
      } else {
        // 컬럼이 없으면 추가 (혹시 모를 경우를 대비)
        await queryInterface.addColumn("LabelTemplates", "html_content", {
          type: Sequelize.TEXT("long"),
          allowNull: true,
        });
      }
    } catch (error) {
      // 테이블이 없으면 에러 무시 (첫 마이그레이션일 수 있음)
      console.warn("LabelTemplates 테이블이 아직 존재하지 않습니다:", error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // 롤백: allowNull을 false로 변경 (원래 상태로)
    try {
      const [results] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM \`LabelTemplates\` LIKE 'html_content';`
      );
      
      if (results && results.length > 0) {
        await queryInterface.changeColumn("LabelTemplates", "html_content", {
          type: Sequelize.TEXT("long"),
          allowNull: false,
        });
      }
    } catch (error) {
      console.warn("롤백 중 오류:", error.message);
    }
  },
};

