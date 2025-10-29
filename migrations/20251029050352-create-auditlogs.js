'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AuditLogs', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      approval_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      approval_task_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      actor_user_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      detail: {
        type: Sequelize.JSON,
        allowNull: true
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
    await queryInterface.dropTable('AuditLogs');
  }
};
