'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Items', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM("RawMaterial", "SemiFinished", "Finished", "Supply"),
        allowNull: false
      },
      unit: {
        type: Sequelize.ENUM("kg", "g", "EA", "BOX", "PCS"),
        allowNull: false,
        defaultValue: "kg"
      },
      factory_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      storage_temp: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      bom_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      shortage: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 5
      },
      expiration_date: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      wholesale_price: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: 0
      },
      storage_condition_id: {
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
    await queryInterface.dropTable('Items');
  }
};
