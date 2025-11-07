"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Labels", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      inventory_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: "재고 ID",
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
        comment: "품목 ID",
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
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // 인덱스 추가
    await queryInterface.addIndex("Labels", ["inventory_id"]);
    await queryInterface.addIndex("Labels", ["barcode"]);
    await queryInterface.addIndex("Labels", ["item_id"]);
    await queryInterface.addIndex("Labels", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Labels");
  },
};

