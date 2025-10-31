"use strict";

module.exports = (sequelize, DataTypes) => {
  const ShippingFile = sequelize.define(
    "shippingfile",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      groupId: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      issueType: {
        type: DataTypes.ENUM("B2B", "B2C"),
        allowNull: false,
      },
      source: {
        type: DataTypes.ENUM("selfmall", "coupang", "smartstore"),
        allowNull: false,
      },
      originalName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      storedName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      path: {
        type: DataTypes.STRING(512),
        allowNull: false,
      },
      size: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM("TEMP", "SAVED", "DELETED"),
        allowNull: false,
        defaultValue: "TEMP",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "shippingfiles",
    }
  );

  return ShippingFile;
};


