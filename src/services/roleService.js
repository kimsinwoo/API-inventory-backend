"use strict";

const db = require("../../models");
const { UserProfile } = db;

/**
 * 모든 사용자 프로필 목록 조회 (권한 정보 포함)
 * 역할 관리 대신 사용자별 권한을 조회
 */
exports.getAllRoles = async () => {
  const profiles = await UserProfile.findAll({
    attributes: [
      'id', 'full_name', 'phone_number', 'email', 'hire_date', 
      'position', 'department', 'role',
      'can_basic_info', 'can_receiving', 'can_plant1_preprocess',
      'can_plant_transfer', 'can_plant2_manufacture', 'can_shipping',
      'can_label', 'can_inventory', 'can_quality', 'can_user_management',
      'created_at', 'updated_at'
    ],
    order: [["id", "ASC"]],
  });
  
  // Role 테이블 형식과 호환되도록 변환
  return profiles.map(profile => ({
    id: profile.id,
    name: profile.full_name || `User ${profile.id}`,
    description: `${profile.position || 'N/A'} - ${profile.department || 'N/A'}`,
    can_basic_info: profile.can_basic_info || false,
    can_receiving: profile.can_receiving || false,
    can_plant1_preprocess: profile.can_plant1_preprocess || false,
    can_plant_transfer: profile.can_plant_transfer || false,
    can_plant2_manufacture: profile.can_plant2_manufacture || false,
    can_shipping: profile.can_shipping || false,
    can_label: profile.can_label || false,
    can_inventory: profile.can_inventory || false,
    can_quality: profile.can_quality || false,
    can_user_management: profile.can_user_management || false,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  }));
};

/**
 * 사용자 프로필 상세 조회 (권한 정보 포함)
 */
exports.getRoleById = async (id) => {
  const profile = await UserProfile.findByPk(id, {
    attributes: [
      'id', 'full_name', 'phone_number', 'email', 'hire_date', 
      'position', 'department', 'role',
      'can_basic_info', 'can_receiving', 'can_plant1_preprocess',
      'can_plant_transfer', 'can_plant2_manufacture', 'can_shipping',
      'can_label', 'can_inventory', 'can_quality', 'can_user_management',
      'created_at', 'updated_at'
    ],
  });
  
  if (!profile) {
    return null;
  }
  
  // Role 테이블 형식과 호환되도록 변환
  return {
    id: profile.id,
    name: profile.full_name || `User ${profile.id}`,
    description: `${profile.position || 'N/A'} - ${profile.department || 'N/A'}`,
    can_basic_info: profile.can_basic_info || false,
    can_receiving: profile.can_receiving || false,
    can_plant1_preprocess: profile.can_plant1_preprocess || false,
    can_plant_transfer: profile.can_plant_transfer || false,
    can_plant2_manufacture: profile.can_plant2_manufacture || false,
    can_shipping: profile.can_shipping || false,
    can_label: profile.can_label || false,
    can_inventory: profile.can_inventory || false,
    can_quality: profile.can_quality || false,
    can_user_management: profile.can_user_management || false,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
};

/**
 * 역할 생성 (UserProfile 생성으로 대체 - 하위 호환성 유지)
 * 실제로는 사용자 생성 API를 사용해야 함
 */
exports.createRole = async (data) => {
  const error = new Error("역할 생성은 사용자 생성 API를 사용하세요. UserProfile은 사용자와 함께 생성됩니다.");
  error.status = 400;
  throw error;
};

/**
 * 역할 수정 (UserProfile 권한 수정)
 */
exports.updateRole = async (id, data) => {
  const profile = await UserProfile.findByPk(id);
  if (!profile) {
    const error = new Error("사용자 프로필을 찾을 수 없습니다");
    error.status = 404;
    throw error;
  }

  // 권한 필드만 업데이트 가능
  const validPermissionFields = [
    'can_basic_info',
    'can_receiving',
    'can_plant1_preprocess',
    'can_plant_transfer',
    'can_plant2_manufacture',
    'can_shipping',
    'can_label',
    'can_inventory',
    'can_quality',
    'can_user_management',
  ];

  const updateData = {};
  for (const [key, value] of Object.entries(data)) {
    if (validPermissionFields.includes(key)) {
      updateData[key] = value === true || value === "true" || value === 1;
    }
  }

  await profile.update(updateData);
  
  // 업데이트된 프로필 반환
  return this.getRoleById(id);
};

/**
 * 역할 삭제 (UserProfile 삭제 - 하위 호환성 유지)
 * 실제로는 사용자 삭제 API를 사용해야 함
 */
exports.deleteRole = async (id) => {
  const profile = await UserProfile.findByPk(id);
  if (!profile) {
    const error = new Error("사용자 프로필을 찾을 수 없습니다");
    error.status = 404;
    throw error;
  }

  await profile.destroy();
  return true;
};

/**
 * 권한 업데이트 (특정 권한만 활성화/비활성화)
 * UserProfile의 권한 필드를 직접 업데이트
 */
exports.updatePermission = async (id, permissionName, value) => {
  const profile = await UserProfile.findByPk(id);
  if (!profile) {
    const error = new Error("사용자 프로필을 찾을 수 없습니다");
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

  await profile.update({
    [permissionName]: value === true || value === "true" || value === 1,
  });

  // 업데이트된 프로필 반환
  return this.getRoleById(id);
};

/**
 * 여러 권한 일괄 업데이트
 * UserProfile의 권한 필드를 직접 업데이트
 */
exports.updatePermissions = async (id, permissions) => {
  const profile = await UserProfile.findByPk(id);
  if (!profile) {
    const error = new Error("사용자 프로필을 찾을 수 없습니다");
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
    "can_user_management"
  ];

  const updateData = {};
  for (const [key, value] of Object.entries(permissions)) {
    if (validPermissions.includes(key)) {
      updateData[key] = value === true || value === "true" || value === 1;
    }
  }

  await profile.update(updateData);
  
  // 업데이트된 프로필 반환
  return this.getRoleById(id);
};

