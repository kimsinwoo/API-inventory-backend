'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      platform: {
        type: Sequelize.ENUM("COUPANG", "NAVER", "11ST", "GMARKET", "MANUAL"),
        allowNull: false
      },
      platform_order_number: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      order_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      customer_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      customer_phone: {
        type: Sequelize.STRING(20)
      },
      customer_email: {
        type: Sequelize.STRING(100)
      },
      recipient_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      recipient_phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      recipient_address: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      recipient_address_detail: {
        type: Sequelize.STRING(100)
      },
      recipient_zipcode: {
        type: Sequelize.STRING(10)
      },
      product_code: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      product_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      total_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      shipping_company: {
        type: Sequelize.STRING(50)
      },
      tracking_number: {
        type: Sequelize.STRING(100)
      },
      shipping_message: {
        type: Sequelize.STRING(200)
      },
      order_status: {
        type: Sequelize.ENUM("PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"),
        allowNull: false,
        defaultValue: "PENDING"
      },
      shipping_status: {
        type: Sequelize.ENUM("WAITING", "READY", "SHIPPED", "DELIVERED"),
        allowNull: false,
        defaultValue: "WAITING"
      },
      payment_status: {
        type: Sequelize.ENUM("PENDING", "PAID", "REFUND"),
        allowNull: false,
        defaultValue: "PENDING"
      },
      issue_type: {
        type: Sequelize.ENUM("B2C", "B2B"),
        allowNull: false,
        defaultValue: "B2C"
      },
      issued_at: {
        type: Sequelize.DATE
      },
      issued_by: {
        type: Sequelize.STRING(50)
      },
      batch_id: {
        type: Sequelize.INTEGER.UNSIGNED
      },
      original_data: {
        type: Sequelize.JSON
      },
      notes: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('Orders');
  }
};
