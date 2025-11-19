"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("LabelTemplates", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      item_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "Items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      item_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      label_type: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      storage_condition: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      registration_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      category_and_form: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      ingredients: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      raw_materials: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      actual_weight: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      printer_name: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      print_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      print_status: {
        type: Sequelize.ENUM("PENDING", "SUCCESS", "FAILED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      error_message: {
        type: Sequelize.TEXT,
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

    // item_id는 외래 키로 추가되므로 자동으로 인덱스가 생성됨
  },

  async down(queryInterface) {
    await queryInterface.dropTable("LabelTemplates");
  },
};

