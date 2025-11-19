"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("InventoryMovements", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM("RECEIVE", "ISSUE", "TRANSFER_OUT", "TRANSFER_IN"),
        allowNull: false,
      },
      item_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "Items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      barcode: {
        type: Sequelize.STRING(14),
        allowNull: false,
        comment: "14자리 유니크 바코드: 타임스탬프(13) + 체크섬(1)",
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      from_factory_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "Factories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      to_factory_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "Factories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      note: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      actor_name: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      occurred_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
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

    // item_id, from_factory_id, to_factory_id는 외래 키로 추가되므로 자동으로 인덱스가 생성됨
    const addIndexSafe = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        if (!error.message.includes("Duplicate key name")) {
          throw error;
        }
      }
    };
    
    await addIndexSafe("InventoryMovements", ["type"]);
    await addIndexSafe("InventoryMovements", ["occurred_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("InventoryMovements");
  },
};

