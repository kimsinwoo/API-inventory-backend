"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class LabelTemplate extends Model {
    static associate(models) {
      LabelTemplate.belongsTo(models.Items, { foreignKey: "item_id", as: "item" });
    }
  }

  LabelTemplate.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      item_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      item_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      label_type: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      storage_condition: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      registration_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      category_and_form: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      ingredients: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      raw_materials: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      actual_weight: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      printer_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      print_count: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      print_status: {
        type: DataTypes.ENUM("PENDING", "SUCCESS", "FAILED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "LabelTemplate",
      tableName: "LabelTemplates",
      timestamps: true,
      underscored: true,
    }
  );

  return LabelTemplate;
};

