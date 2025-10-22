"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class BOMComponent extends Model {
    static associate(models) {
      BOMComponent.belongsTo(models.BOM, { foreignKey: "bom_id", as: "bom" });
      BOMComponent.belongsTo(models.Items, { foreignKey: "item_id", as: "item" });
    }
  }

  BOMComponent.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      bom_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      item_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // 원재료/반제품 등
      quantity: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
      unit: { type: DataTypes.STRING(16), allowNull: false }, // 유연하게 문자열로 관리(g, kg, EA, BOX, PCS 등)
      sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      loss_rate: { type: DataTypes.DECIMAL(5, 4), allowNull: false, defaultValue: 0 }, // 0.0500 = 5% 손실률
    },
    { sequelize, modelName: "BOMComponent", tableName: "BOMComponents", timestamps: true, underscored: true }
  );

  return BOMComponent;
};
