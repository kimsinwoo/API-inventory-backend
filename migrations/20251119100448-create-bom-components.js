"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("BOMComponents", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      bom_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "BOMs",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      item_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "Items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING(16),
        allowNull: false,
      },
      sort_order: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      loss_rate: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0,
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

    // bom_id, item_id는 외래 키로 추가되므로 자동으로 인덱스가 생성됨
  },

  async down(queryInterface) {
    await queryInterface.dropTable("BOMComponents");
  },
};

