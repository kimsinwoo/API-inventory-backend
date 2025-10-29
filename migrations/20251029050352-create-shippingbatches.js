'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ShippingBatches', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      batch_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      batch_name: {
        type: Sequelize.STRING(100)
      },
      batch_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      total_orders: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0
      },
      b2c_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0
      },
      b2b_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0
      },
      original_files: {
        type: Sequelize.JSON
      },
      export_file_path: {
        type: Sequelize.STRING(500)
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "CONFIRMED", "EXPORTED", "COMPLETED"),
        allowNull: false,
        defaultValue: "DRAFT"
      },
      created_by: {
        type: Sequelize.STRING(50)
      },
      confirmed_by: {
        type: Sequelize.STRING(50)
      },
      confirmed_at: {
        type: Sequelize.DATE
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'updated_at'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ShippingBatches');
  }
};
