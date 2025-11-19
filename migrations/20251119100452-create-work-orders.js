"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("WorkOrders", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      work_order_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: "작업 지시서 번호 (예: WO-20251030-001)",
      },
      product_item_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: "생산할 완제품 ID",
      },
      bom_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: "사용할 BOM ID",
      },
      factory_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: "생산 공장 ID",
      },
      planned_quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        comment: "계획 생산 수량",
      },
      actual_quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: true,
        comment: "실제 생산 수량",
      },
      unit: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      scheduled_start_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "생산 예정 시작일",
      },
      scheduled_end_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "생산 예정 완료일",
      },
      actual_start_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "실제 시작일",
      },
      actual_end_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "실제 완료일",
      },
      created_by_user_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      completed_by_user_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      notes: {
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

    // work_order_number는 필드 정의에서 unique: true로 이미 인덱스가 생성됨
    // product_item_id, bom_id, factory_id는 외래 키로 추가되므로 자동으로 인덱스가 생성됨
    
    const addIndexSafe = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        if (!error.message.includes("Duplicate key name")) {
          throw error;
        }
      }
    };
    
    await addIndexSafe("WorkOrders", ["status"], { name: "work_orders_status" });
    await addIndexSafe("WorkOrders", ["created_at"], { name: "work_orders_created_at" });

    // 외래 키 제약 조건 추가 (참조 테이블이 생성된 후)
    const [itemsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'Items'");
    if (itemsTable.length > 0) {
      await queryInterface.addConstraint("WorkOrders", {
        fields: ["product_item_id"],
        type: "foreign key",
        name: "workorders_product_item_id_fk",
        references: {
          table: "Items",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }

    const [bomsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'BOMs'");
    if (bomsTable.length > 0) {
      await queryInterface.addConstraint("WorkOrders", {
        fields: ["bom_id"],
        type: "foreign key",
        name: "workorders_bom_id_fk",
        references: {
          table: "BOMs",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }

    const [factoriesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'Factories'");
    if (factoriesTable.length > 0) {
      await queryInterface.addConstraint("WorkOrders", {
        fields: ["factory_id"],
        type: "foreign key",
        name: "workorders_factory_id_fk",
        references: {
          table: "Factories",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("WorkOrders");
  },
};

