'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BOMComponents', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      bom_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      item_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false
      },
      unit: {
        type: Sequelize.STRING(16),
        allowNull: false
      },
      sort_order: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      loss_rate: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0
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
    await queryInterface.dropTable('BOMComponents');
  }
};
