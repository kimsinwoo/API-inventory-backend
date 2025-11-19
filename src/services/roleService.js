"use strict";

const db = require("../../models");
const { Role } = db;

/**
 * 모든 역할 목록 조회
 */
exports.getAllRoles = async () => {
  return Role.findAll({
    order: [["id", "ASC"]],
  });
};

/**
 * 역할 상세 조회
 */
exports.getRoleById = async (id) => {
  return Role.findByPk(id);
};

/**
 * 역할 생성
 */
exports.createRole = async (data) => {
  return Role.create(data);
};

/**
 * 역할 수정
 */
exports.updateRole = async (id, data) => {
  const role = await Role.findByPk(id);
  if (!role) {
    const error = new Error("역할을 찾을 수 없습니다");
    error.status = 404;
    throw error;
  }

  // 시스템 역할은 is_system 필드 수정 불가
  if (role.is_system && data.is_system === false) {
    const error = new Error("시스템 역할은 삭제할 수 없습니다");
    error.status = 400;
    throw error;
  }

  await role.update(data);
  return role;
};

/**
 * 역할 삭제
 */
exports.deleteRole = async (id) => {
  const role = await Role.findByPk(id);
  if (!role) {
    const error = new Error("역할을 찾을 수 없습니다");
    error.status = 404;
    throw error;
  }

  if (role.is_system) {
    const error = new Error("시스템 역할은 삭제할 수 없습니다");
    error.status = 400;
    throw error;
  }

  await role.destroy();
  return true;
};

/**
 * 권한 업데이트 (특정 권한만 활성화/비활성화)
 */
exports.updatePermission = async (id, permissionName, value) => {
  const role = await Role.findByPk(id);
  if (!role) {
    const error = new Error("역할을 찾을 수 없습니다");
    error.status = 404;
    throw error;
  }

  const validPermissions = [
    "can_basic_info",
    "can_receiving",
    "can_plant1_preprocess",
    "can_plant_transfer",
    "can_plant2_manufacture",
    "can_shipping",
    "can_label",
    "can_inventory",
    "can_quality",
    "can_user_management",
  ];

  if (!validPermissions.includes(permissionName)) {
    const error = new Error(`유효하지 않은 권한 이름입니다: ${permissionName}`);
    error.status = 400;
    throw error;
  }

  await role.update({
    [permissionName]: value === true || value === "true" || value === 1,
  });

  return role;
};

/**
 * 여러 권한 일괄 업데이트
 */
exports.updatePermissions = async (id, permissions) => {
  const role = await Role.findByPk(id);
  if (!role) {
    const error = new Error("역할을 찾을 수 없습니다");
    error.status = 404;
    throw error;
  }

  const validPermissions = [
    "can_basic_info",
    "can_receiving",
    "can_plant1_preprocess",
    "can_plant_transfer",
    "can_plant2_manufacture",
    "can_shipping",
    "can_label",
    "can_inventory",
    "can_quality",
    "can_user_management",
  ];

  const updateData = {};
  for (const [key, value] of Object.entries(permissions)) {
    if (validPermissions.includes(key)) {
      updateData[key] = value === true || value === "true" || value === 1;
    }
  }

  await role.update(updateData);
  return role;
};

