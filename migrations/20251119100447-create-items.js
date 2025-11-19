"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Items", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM("RawMaterial", "SemiFinished", "Finished", "Supply"),
        allowNull: false,
      },
      unit: {
        type: Sequelize.ENUM("kg", "g", "L", "EA", "BOX", "PCS", "ROLL"),
        allowNull: false,
        defaultValue: "kg",
      },
      factory_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "Factories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      storage_temp: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      bom_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "BOMs",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      shortage: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 5,
      },
      expiration_date: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      wholesale_price: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: 0,
      },
      storage_condition_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "StorageConditions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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

    // code는 필드 정의에서 unique: true로 이미 인덱스가 생성됨
    // factory_id, bom_id, storage_condition_id는 외래 키로 추가되므로 자동으로 인덱스가 생성됨
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Items");
  },
};

