"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Items extends Model {
    static associate(models) {
      Items.belongsTo(models.Factory, { foreignKey: "factory_id" });
      Items.belongsTo(models.StorageCondition, { foreignKey: "storage_condition_id" });
      Items.belongsTo(models.BOM, { foreignKey: "bom_id" });
      Items.hasMany(models.Inventories, { foreignKey: "item_id" });
    }
  }

  Items.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(50), allowNull: false },
      category: {
        type: DataTypes.ENUM("RawMaterial", "SemiFinished", "Finished", "Supply"),
        allowNull: false,
      },
      unit: {
        type: DataTypes.ENUM("kg", "g", "EA", "BOX", "PCS"),
        allowNull: false,
        defaultValue: "kg",
      },
      factory_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      storage_condition_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      bom_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      shortage: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 5 },
      first_received_at: { type: DataTypes.DATE },
      latest_received_at: { type: DataTypes.DATE },
    },
    { sequelize, modelName: "Items", tableName: "Items", timestamps: true, underscored: true }
  );

  return Items;
};
