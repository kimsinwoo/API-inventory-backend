"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Labels", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      inventory_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "Inventories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      barcode: {
        type: Sequelize.STRING(14),
        allowNull: false,
        comment: "바코드",
      },
      item_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "Items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      product_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "제품명",
      },
      registration_code: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: "등록번호 (item.code)",
      },
      manufacture_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: "제조일자 (출력 시 입력)",
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: "유통기한 (출력 시 입력)",
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: "수량",
      },
      unit: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: "단위",
      },
      label_size: {
        type: Sequelize.ENUM("large", "medium", "small"),
        allowNull: false,
        defaultValue: "large",
        comment: "라벨 크기",
      },
      label_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: "라벨 생성에 필요한 추가 데이터 (JSON)",
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

    // inventory_id, item_id는 외래 키로 추가되므로 자동으로 인덱스가 생성됨
    const addIndexSafe = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        if (!error.message.includes("Duplicate key name")) {
          throw error;
        }
      }
    };
    
    await addIndexSafe("Labels", ["barcode"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Labels");
  },
};

