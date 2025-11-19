"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("RequiredApprovers", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      form_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      order: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      role_code: {
        type: Sequelize.ENUM("STAFF", "TEAM_LEAD", "DIRECTOR", "CEO"),
        allowNull: false,
      },
      required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      conditions: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      parallel_group_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
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
    
    await addIndexSafe("RequiredApprovers", ["form_code"]);
    await addIndexSafe("RequiredApprovers", ["order"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("RequiredApprovers");
  },
};

