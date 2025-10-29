'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('InventoryMovements', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: Sequelize.ENUM("RECEIVE", "ISSUE", "TRANSFER_OUT", "TRANSFER_IN"),
        allowNull: false
      },
      item_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      lot_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      unit: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      from_factory_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      to_factory_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      note: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      actor_name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      occurred_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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
    await queryInterface.dropTable('InventoryMovements');
  }
};
