"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Inventories", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
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
      factory_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "Factories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      storage_condition_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "StorageConditions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      barcode: {
        type: Sequelize.STRING(14),
        allowNull: false,
        comment: "14자리 유니크 바코드: 타임스탬프(13) + 체크섬(1)",
      },
      wholesale_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      received_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      first_received_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: "제조 일자 (바코드 생성 기준)",
      },
      expiration_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: "유통기한 날짜",
      },
      status: {
        type: Sequelize.ENUM("Normal", "LowStock", "Expiring", "Expired"),
        allowNull: false,
        defaultValue: "Normal",
      },
      unit: {
        type: Sequelize.STRING(10),
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

    // item_id, factory_id, storage_condition_id는 외래 키로 추가되므로 자동으로 인덱스가 생성됨
    const addIndexSafe = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        if (!error.message.includes("Duplicate key name")) {
          throw error;
        }
      }
    };
    
    await addIndexSafe("Inventories", ["barcode"], { unique: true });
    await addIndexSafe("Inventories", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Inventories");
  },
};

