"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.Items, { 
        foreignKey: "product_code",
        targetKey: "code",
        as: "product" 
      });
      Order.belongsTo(models.ShippingBatch, { 
        foreignKey: "batch_id",
        as: "batch" 
      });
    }
  }

  Order.init(
    {
      id: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        autoIncrement: true, 
        primaryKey: true 
      },
      
      // 플랫폼 정보
      platform: { 
        type: DataTypes.ENUM("COUPANG", "NAVER", "11ST", "GMARKET", "MANUAL"),
        allowNull: false 
      },
      platform_order_number: { 
        type: DataTypes.STRING(100), 
        allowNull: false 
      },
      order_date: { 
        type: DataTypes.DATE, 
        allowNull: false 
      },
      
      // 주문자 정보
      customer_name: { 
        type: DataTypes.STRING(50), 
        allowNull: false 
      },
      customer_phone: { 
        type: DataTypes.STRING(20) 
      },
      customer_email: { 
        type: DataTypes.STRING(100) 
      },
      
      // 수령인 정보
      recipient_name: { 
        type: DataTypes.STRING(50), 
        allowNull: false 
      },
      recipient_phone: { 
        type: DataTypes.STRING(20), 
        allowNull: false 
      },
      recipient_address: { 
        type: DataTypes.STRING(200), 
        allowNull: false 
      },
      recipient_address_detail: { 
        type: DataTypes.STRING(100) 
      },
      recipient_zipcode: { 
        type: DataTypes.STRING(10) 
      },
      
      // 주문 상품 정보
      product_code: { 
        type: DataTypes.STRING(50), 
        allowNull: false 
      },
      product_name: { 
        type: DataTypes.STRING(100), 
        allowNull: false 
      },
      quantity: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        allowNull: false 
      },
      unit_price: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
      },
      total_price: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
      },
      
      // 배송 정보
      shipping_company: { 
        type: DataTypes.STRING(50) 
      },
      tracking_number: { 
        type: DataTypes.STRING(100) 
      },
      shipping_message: { 
        type: DataTypes.STRING(200) 
      },
      
      // 상태 관리
      order_status: { 
        type: DataTypes.ENUM("PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"),
        allowNull: false,
        defaultValue: "PENDING"
      },
      shipping_status: { 
        type: DataTypes.ENUM("WAITING", "READY", "SHIPPED", "DELIVERED"),
        allowNull: false,
        defaultValue: "WAITING"
      },
      payment_status: { 
        type: DataTypes.ENUM("PENDING", "PAID", "REFUND"),
        allowNull: false,
        defaultValue: "PENDING"
      },
      
      // 출고 정보
      issue_type: { 
        type: DataTypes.ENUM("B2C", "B2B"),
        allowNull: false,
        defaultValue: "B2C"
      },
      issued_at: { 
        type: DataTypes.DATE 
      },
      issued_by: { 
        type: DataTypes.STRING(50) 
      },
      
      // 배치 정보
      batch_id: { 
        type: DataTypes.INTEGER.UNSIGNED 
      },
      
      // 메타 정보
      original_data: { 
        type: DataTypes.JSON 
      },
      notes: { 
        type: DataTypes.TEXT 
      },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "Orders",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["platform_order_number"] },
        { fields: ["batch_id"] },
        { fields: ["order_status"] },
        { fields: ["shipping_status"] },
        { fields: ["order_date"] },
      ]
    }
  );

  return Order;
};

