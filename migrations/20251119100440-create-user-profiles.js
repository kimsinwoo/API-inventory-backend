"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("UserProfiles", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      phone_number: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      hire_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      position: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      department: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      role: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        comment: "Role ID (Roles 테이블 참조)",
      },
      signature_image_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: "사용자 도장(서명) 이미지 경로",
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

    // Roles 테이블이 생성된 후 외래 키 제약 조건 추가
    const [rolesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'Roles'");
    if (rolesTable.length > 0) {
      await queryInterface.addConstraint("UserProfiles", {
        fields: ["role"],
        type: "foreign key",
        name: "userprofiles_role_fk",
        references: {
          table: "Roles",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("UserProfiles");
  },
};

