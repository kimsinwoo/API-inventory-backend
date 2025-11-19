"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Attachments", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      approval_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "Approvals",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      kind: {
        type: Sequelize.ENUM("source_csv", "pdf", "other"),
        allowNull: false,
      },
      path: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      original_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      meta: {
        type: Sequelize.JSON,
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
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });

    // approval_id는 외래 키로 추가되므로 자동으로 인덱스가 생성됨
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Attachments");
  },
};

