"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ShippingBatch extends Model {
    static associate(models) {
      ShippingBatch.hasMany(models.Order, {
        foreignKey: "batch_id",
        as: "orders"
      });
    }
  }

  ShippingBatch.init(
    {
      id: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        autoIncrement: true, 
        primaryKey: true 
      },
      
      // 배치 기본 정보
      batch_number: { 
        type: DataTypes.STRING(50), 
        allowNull: false,
        unique: true
      },
      batch_name: { 
        type: DataTypes.STRING(100) 
      },
      batch_date: { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
      },
      
      // 배치 통계
      total_orders: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        defaultValue: 0 
      },
      b2c_count: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        defaultValue: 0 
      },
      b2b_count: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        defaultValue: 0 
      },
      
      // 파일 정보
      original_files: { 
        type: DataTypes.JSON 
      },
      export_file_path: { 
        type: DataTypes.STRING(500) 
      },
      
      // 상태
      status: { 
        type: DataTypes.ENUM("DRAFT", "CONFIRMED", "EXPORTED", "COMPLETED"),
        allowNull: false,
        defaultValue: "DRAFT"
      },
      
      // 담당자 정보
      created_by: { 
        type: DataTypes.STRING(50) 
      },
      confirmed_by: { 
        type: DataTypes.STRING(50) 
      },
      confirmed_at: { 
        type: DataTypes.DATE 
      },
    },
    {
      sequelize,
      modelName: "ShippingBatch",
      tableName: "ShippingBatches",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["batch_number"], unique: true },
        { fields: ["batch_date"] },
        { fields: ["status"] },
      ]
    }
  );

  return ShippingBatch;
};

