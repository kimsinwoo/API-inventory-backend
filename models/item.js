"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Inventories extends Model {
    static associate(models) {
      Inventories.belongsTo(models.Items, { foreignKey: "item_id" });
      Inventories.belongsTo(models.Factory, { foreignKey: "factory_id" });
      Inventories.belongsTo(models.StorageCondition, { foreignKey: "storage_condition_id" });
    }
  }

  Inventories.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      item_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      factory_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      storage_condition_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      lot_number: { type: DataTypes.STRING(50), allowNull: false },
      wholesale_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      received_at: { type: DataTypes.DATE, allowNull: false },
      first_received_at: { type: DataTypes.DATE, allowNull: false },
      expiration_date: { type: DataTypes.DATEONLY, allowNull: false },
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
