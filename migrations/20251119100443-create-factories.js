"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Factories", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM("1PreProcessing", "2Manufacturing", "Warehouse"),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // ✅ 기본 공장 데이터 삽입
    const now = new Date();

    await queryInterface.bulkInsert("Factories", [
      {
        type: "1PreProcessing",
        name: "1공장",
        address: "경상북도 의성군 안계면 용기5길 12",
        created_at: now,
        updated_at: now,
      },
      {
        type: "2Manufacturing",
        name: "2공장",
        address: "경북 상주시 냉림1길 66",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    // 기본 데이터 먼저 지우고 테이블 삭제
    await queryInterface.bulkDelete(
      "Factories",
      {
        name: ["1공장", "2공장"],
      },
      {}
    );
    await queryInterface.dropTable("Factories");
  },
};
