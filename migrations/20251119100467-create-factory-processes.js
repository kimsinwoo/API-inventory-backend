"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Factory와 Process 간의 다대다 관계를 위한 중간 테이블
    await queryInterface.createTable("FactoryProcesses", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      factory_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "Factories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      process_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "Processes",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });

    // factory_id, process_id는 외래 키로 추가되므로 자동으로 인덱스가 생성됨
    // 복합 unique 인덱스는 중복 관계 방지를 위해 필요
    const addIndexSafe = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        if (!error.message.includes("Duplicate key name")) {
          throw error;
        }
      }
    };
    
    await addIndexSafe("FactoryProcesses", ["factory_id", "process_id"], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("FactoryProcesses");
  },
};

