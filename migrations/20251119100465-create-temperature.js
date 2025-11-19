"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Temperature", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      storage_type: {
        type: Sequelize.ENUM("coldStorage", "freezer"),
        allowNull: false,
      },
      temp: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      inspector: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      profile_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
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

    const addIndexSafe = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        if (!error.message.includes("Duplicate key name")) {
          throw error;
        }
      }
    };
    
    await addIndexSafe("Temperature", ["date"]);
    await addIndexSafe("Temperature", ["storage_type"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Temperature");
  },
};

