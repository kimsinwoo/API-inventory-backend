"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ApprovalTasks", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      approval_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "Approvals",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      required_approver_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "RequiredApprovers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      order: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      assignee_role_code: {
        type: Sequelize.ENUM("STAFF", "TEAM_LEAD", "DIRECTOR", "CEO"),
        allowNull: false,
      },
      assignee_user_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("WAITING", "REQUESTED", "APPROVED", "REJECTED", "AUTO_SKIPPED"),
        allowNull: false,
        defaultValue: "WAITING",
      },
      signed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      signature_image_path: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      comment: {
        type: Sequelize.TEXT,
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

    // approval_id, required_approver_id는 외래 키로 추가되므로 자동으로 인덱스가 생성됨
    const addIndexSafe = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        if (!error.message.includes("Duplicate key name")) {
          throw error;
        }
      }
    };
    
    await addIndexSafe("ApprovalTasks", ["status"]);
    await addIndexSafe("ApprovalTasks", ["order"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ApprovalTasks");
  },
};

