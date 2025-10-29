'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RequiredApprovers', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      form_code: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      order: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      role_code: {
        type: Sequelize.ENUM("STAFF", "TEAM_LEAD", "DIRECTOR", "CEO"),
        allowNull: false
      },
      required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      conditions: {
        type: Sequelize.JSON,
        allowNull: true
      },
      parallel_group_id: {
        type: Sequelize.INTEGER.UNSIGNED,
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
    await queryInterface.dropTable('RequiredApprovers');
  }
};
