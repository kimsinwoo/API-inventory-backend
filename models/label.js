"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Label extends Model {
    static associate(models) {
      Label.belongsTo(models.Items, { foreignKey: "item_id", as: "item" });
      Label.belongsTo(models.Inventories, { foreignKey: "inventory_id", as: "inventory" });
    }
  }

  Label.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      inventory_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: "재고 ID",
      },
      barcode: {
        type: DataTypes.STRING(14),
        allowNull: false,
        comment: "바코드",
      },
      item_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: "품목 ID",
      },
      product_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "제품명",
      },
      registration_code: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: "등록번호 (item.code)",
      },
      manufacture_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "제조일자 (출력 시 입력)",
      },
      expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "유통기한 (출력 시 입력)",
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "수량",
      },
      unit: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: "단위",
      },
      label_size: {
        type: DataTypes.ENUM("large", "medium", "small"),
        allowNull: false,
        defaultValue: "large",
        comment: "라벨 크기",
      },
      label_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "라벨 생성에 필요한 추가 데이터 (JSON)",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Label",
      tableName: "Labels",
      timestamps: true,
      underscored: true,
    }
  );

  return Label;
};

