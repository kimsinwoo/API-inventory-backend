"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ApplicableItem extends Model {
    static associate(models) {
      // StorageCondition과의 관계 제거
      // applicable_items는 텍스트 필드로만 저장되므로 관계가 필요 없음
    }
  }

  ApplicableItem.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      shelf_life: { type: DataTypes.INTEGER.UNSIGNED },
      unit: { type: DataTypes.STRING(20) },
    },
    { sequelize, modelName: "ApplicableItem", tableName: "ApplicableItems", timestamps: true, underscored: true }
  );

  return ApplicableItem;
};
