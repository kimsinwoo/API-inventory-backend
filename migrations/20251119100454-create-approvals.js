"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Approvals", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      form_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      created_by_user_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "IN_PROGRESS", "REJECTED", "APPROVED", "EXPORTED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      current_order: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      title: {
        type: Sequelize.STRING(200),
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
    
    await addIndexSafe("Approvals", ["form_code"]);
    await addIndexSafe("Approvals", ["status"]);
    await addIndexSafe("Approvals", ["created_by_user_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Approvals");
  },
};

