"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Orders", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      platform: {
        type: Sequelize.ENUM("COUPANG", "NAVER", "11ST", "GMARKET", "MANUAL"),
        allowNull: false,
      },
      platform_order_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      order_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      customer_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      customer_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      customer_email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      recipient_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      recipient_phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      recipient_address: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      recipient_address_detail: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      recipient_zipcode: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      product_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      product_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      total_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      shipping_company: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      tracking_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      shipping_message: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      order_status: {
        type: Sequelize.ENUM("PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      shipping_status: {
        type: Sequelize.ENUM("WAITING", "READY", "SHIPPED", "DELIVERED"),
        allowNull: false,
        defaultValue: "WAITING",
      },
      payment_status: {
        type: Sequelize.ENUM("PENDING", "PAID", "REFUND"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      issue_type: {
        type: Sequelize.ENUM("B2C", "B2B"),
        allowNull: false,
        defaultValue: "B2C",
      },
      issued_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      issued_by: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      batch_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "ShippingBatches",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      original_data: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
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

    // batch_id는 외래 키로 추가되므로 자동으로 인덱스가 생성됨
    const addIndexSafe = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        if (!error.message.includes("Duplicate key name")) {
          throw error;
        }
      }
    };
    
    await addIndexSafe("Orders", ["platform_order_number"]);
    await addIndexSafe("Orders", ["order_status"]);
    await addIndexSafe("Orders", ["shipping_status"]);
    await addIndexSafe("Orders", ["order_date"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Orders");
  },
};

