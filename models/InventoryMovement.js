"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class InventoryMovement extends Model {
    static associate(models) {
      InventoryMovement.belongsTo(models.Items, { foreignKey: "item_id" });
      InventoryMovement.belongsTo(models.Factory, { as: "fromFactory", foreignKey: "from_factory_id" });
      InventoryMovement.belongsTo(models.Factory, { as: "toFactory", foreignKey: "to_factory_id" });
    }
  }

  InventoryMovement.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      type: { type: DataTypes.ENUM("RECEIVE", "ISSUE", "TRANSFER_OUT", "TRANSFER_IN"), allowNull: false },
      item_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      barcode: { type: DataTypes.STRING(14), allowNull: false, comment: "14자리 유니크 바코드: 타임스탬프(13) + 체크섬(1)" },
      quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      unit: { type: DataTypes.STRING(10), allowNull: false },
      from_factory_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      to_factory_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      note: { type: DataTypes.STRING(200), allowNull: true },
      actor_name: { type: DataTypes.STRING(50), allowNull: true },
      occurred_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { sequelize, modelName: "InventoryMovement", tableName: "InventoryMovements", timestamps: true, underscored: true }
  );

  return InventoryMovement;
};
