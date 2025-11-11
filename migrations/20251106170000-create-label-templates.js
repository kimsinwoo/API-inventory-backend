"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("LabelTemplates", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      item_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
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
      html_content: {
        type: Sequelize.TEXT("long"),
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
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("LabelTemplates", ["item_id"]);
    await queryInterface.addIndex("LabelTemplates", ["registration_number"]);
    await queryInterface.addIndex("LabelTemplates", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("LabelTemplates");
  },
};

