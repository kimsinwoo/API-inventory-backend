"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("shippingfiles", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      groupId: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      issueType: {
        type: Sequelize.ENUM("B2B", "B2C"),
        allowNull: false,
      },
      source: {
        type: Sequelize.ENUM("selfmall", "coupang", "smartstore"),
        allowNull: false,
      },
      originalName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      storedName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      path: {
        type: Sequelize.STRING(512),
        allowNull: false,
      },
      size: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM("TEMP", "SAVED", "DELETED"),
        allowNull: false,
        defaultValue: "TEMP",
      },
      expiresAt: {
        type: Sequelize.DATE,
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
    
    await addIndexSafe("shippingfiles", ["groupId"]);
    await addIndexSafe("shippingfiles", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("shippingfiles");
  },
};

