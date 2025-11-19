"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PlannedTransactions", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      transaction_type: {
        type: Sequelize.ENUM("RECEIVE", "ISSUE"),
        allowNull: false,
        comment: "RECEIVE: 입고 예정, ISSUE: 출고 예정",
      },
      item_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "Items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "APPROVED", "COMPLETED", "CANCELLED"),
        allowNull: false,
        defaultValue: "PENDING",
        comment: "PENDING: 대기, APPROVED: 승인됨, COMPLETED: 완료, CANCELLED: 취소",
      },
      scheduled_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: "예정일",
      },
      requested_by_user_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: "요청자 ID",
      },
      approved_by_user_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "승인자 ID",
      },
      completed_by_user_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "완료 처리자 ID",
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      supplier_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "공급업체명 (입고용)",
      },
      barcode: {
        type: Sequelize.STRING(14),
        allowNull: true,
        comment: "14자리 유니크 바코드 (입고 예정 시 미리 생성 가능)",
      },
      wholesale_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: "도매가 (입고용)",
      },
      storage_condition_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "StorageConditions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        comment: "보관 조건 ID (입고용)",
      },
      customer_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "고객명 (출고용)",
      },
      issue_type: {
        type: Sequelize.ENUM("PRODUCTION", "SHIPPING", "DAMAGE", "OTHER"),
        allowNull: true,
        defaultValue: "OTHER",
        comment: "출고 유형",
      },
      shipping_address: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: "배송지 (출고용)",
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "비고",
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "거부 사유 (CANCELLED 상태일 때)",
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

    // item_id, factory_id, storage_condition_id는 외래 키로 추가되므로 자동으로 인덱스가 생성됨
    const addIndexSafe = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        if (!error.message.includes("Duplicate key name")) {
          throw error;
        }
      }
    };
    
    await addIndexSafe("PlannedTransactions", ["transaction_type"]);
    await addIndexSafe("PlannedTransactions", ["status"]);
    await addIndexSafe("PlannedTransactions", ["scheduled_date"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("PlannedTransactions");
  },
};

