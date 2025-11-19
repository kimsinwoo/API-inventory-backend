"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ShippingBatches", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      batch_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      batch_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      batch_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      total_orders: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
      },
      b2c_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
      },
      b2b_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
      },
      original_files: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      export_file_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "CONFIRMED", "EXPORTED", "COMPLETED"),
        allowNull: false,
        defaultValue: "DRAFT",
      },
      created_by: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      confirmed_by: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      confirmed_at: {
        type: Sequelize.DATE,
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

    // batch_number는 필드 정의에서 unique: true로 이미 인덱스가 생성됨
    const addIndexSafe = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        if (!error.message.includes("Duplicate key name")) {
          throw error;
        }
      }
    };
    
    await addIndexSafe("ShippingBatches", ["batch_date"]);
    await addIndexSafe("ShippingBatches", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ShippingBatches");
  },
};

