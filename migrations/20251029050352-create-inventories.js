'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Inventories', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      item_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      factory_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      storage_condition_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      lot_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      wholesale_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      received_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      first_received_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      expiration_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM("Normal", "LowStock", "Expiring", "Expired"),
        allowNull: false,
        defaultValue: "Normal"
      },
      unit: {
        type: Sequelize.STRING(10),
        allowNull: false
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
    await queryInterface.dropTable('Inventories');
  }
};
