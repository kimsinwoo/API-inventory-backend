'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ApprovalTasks', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      approval_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      required_approver_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      order: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      assignee_role_code: {
        type: Sequelize.ENUM("STAFF", "TEAM_LEAD", "DIRECTOR", "CEO"),
        allowNull: false
      },
      assignee_user_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM("WAITING", "REQUESTED", "APPROVED", "REJECTED", "AUTO_SKIPPED"),
        allowNull: false,
        defaultValue: "WAITING"
      },
      signed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      signature_image_path: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      comment: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('ApprovalTasks');
  }
};
