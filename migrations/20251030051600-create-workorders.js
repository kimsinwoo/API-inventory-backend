"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("WorkOrders", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      work_order_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      product_item_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "Items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      bom_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "BOMs",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      factory_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "Factories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      planned_quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
      },
      actual_quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: true,
      },
      unit: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      scheduled_start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      scheduled_end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      actual_start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      actual_end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_by_user_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      completed_by_user_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("WorkOrders", ["work_order_number"], {
      unique: true,
    });
    await queryInterface.addIndex("WorkOrders", ["product_item_id"]);
    await queryInterface.addIndex("WorkOrders", ["factory_id"]);
    await queryInterface.addIndex("WorkOrders", ["status"]);
    await queryInterface.addIndex("WorkOrders", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("WorkOrders");
  },
};



