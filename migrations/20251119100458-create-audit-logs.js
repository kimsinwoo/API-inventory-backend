"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("AuditLogs", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      approval_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "Approvals",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      approval_task_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "ApprovalTasks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      actor_user_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      detail: {
        type: Sequelize.JSON,
        allowNull: true,
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

    // approval_id, approval_task_id는 외래 키로 추가되므로 자동으로 인덱스가 생성됨
    const addIndexSafe = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        if (!error.message.includes("Duplicate key name")) {
          throw error;
        }
      }
    };
    
    await addIndexSafe("AuditLogs", ["actor_user_id"]);
    await addIndexSafe("AuditLogs", ["action"]);
    await addIndexSafe("AuditLogs", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("AuditLogs");
  },
};

