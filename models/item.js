"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Inventories extends Model {
    static associate(models) {
      Inventories.belongsTo(models.Items, { foreignKey: "item_id" });
      Inventories.belongsTo(models.Factory, { foreignKey: "factory_id" });
      Inventories.belongsTo(models.StorageCondition, { foreignKey: "storage_condition_id" });
      Inventories.hasMany(models.Label, { foreignKey: "inventory_id", as: "labels" });
    }
  }

  Inventories.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      item_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      factory_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      storage_condition_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      barcode: { type: DataTypes.STRING(14), allowNull: false, comment: "14자리 유니크 바코드: 타임스탬프(13) + 체크섬(1)" },
      wholesale_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      received_at: { type: DataTypes.DATE, allowNull: false },
      first_received_at: { type: DataTypes.DATE, allowNull: false, comment: "제조 일자 (바코드 생성 기준)" },
      expiration_date: { type: DataTypes.DATEONLY, allowNull: false, comment: "유통기한 (first_received_at + 품목.expiration_date 일수)" },
      status: {
        type: DataTypes.ENUM("Normal", "LowStock", "Expiring", "Expired"),
        allowNull: false,
        defaultValue: "Normal",
      },
      unit: { type: DataTypes.STRING(10), allowNull: false },
    },
    { sequelize, modelName: "Inventories", tableName: "Inventories", timestamps: true, underscored: true }
  );

  return Inventories;
};
