"use strict";

const roleService = require("../services/roleService");

/**
 * 모든 역할 목록 조회
 */
exports.index = async (req, res, next) => {
  try {
    const roles = await roleService.getAllRoles();
    res.json({ ok: true, data: roles });
  } catch (error) {
    next(error);
  }
};

/**
 * 역할 상세 조회
 */
exports.show = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById(req.params.id);
    if (!role) {
      return res.status(404).json({ ok: false, message: "역할을 찾을 수 없습니다" });
    }
    res.json({ ok: true, data: role });
  } catch (error) {
    next(error);
  }
};

/**
 * 역할 생성
 */
exports.create = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body);
    res.status(201).json({ ok: true, data: role });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ ok: false, message: "이미 존재하는 역할 이름입니다" });
    }
    next(error);
  }
};

/**
 * 역할 수정
 */
exports.update = async (req, res, next) => {
  try {
    const role = await roleService.updateRole(req.params.id, req.body);
    res.json({ ok: true, data: role });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ ok: false, message: error.message });
    }
    if (error.status === 400) {
      return res.status(400).json({ ok: false, message: error.message });
    }
    next(error);
  }
};

/**
 * 역할 삭제
 */
exports.destroy = async (req, res, next) => {
  try {
    await roleService.deleteRole(req.params.id);
    res.json({ ok: true, message: "역할이 삭제되었습니다" });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ ok: false, message: error.message });
    }
    if (error.status === 400) {
      return res.status(400).json({ ok: false, message: error.message });
    }
    next(error);
  }
};

/**
 * 권한 업데이트 (단일 권한, 사용자별)
 * PUT /api/roles/:id/permissions/:permissionName
 * 주의: :id는 User ID를 의미합니다 (기존 API 주소 유지)
 */
exports.updatePermission = async (req, res, next) => {
  try {
    const { id, permissionName } = req.params; // id는 User ID
    const { value } = req.body;
    
    const authService = require("../services/authService");
    const permissions = { [permissionName]: value };
    const user = await authService.updateUserPermissions(req, id, permissions);
    res.json({ ok: true, data: user });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ ok: false, message: error.message });
    }
    if (error.status === 400) {
      return res.status(400).json({ ok: false, message: error.message });
    }
    next(error);
  }
};

/**
 * 권한 일괄 업데이트 (사용자별)
 * PUT /api/roles/:id/permissions
 * 주의: :id는 User ID를 의미합니다 (기존 API 주소 유지)
 */
exports.updatePermissions = async (req, res, next) => {
  try {
    const { id } = req.params; // User ID
    const permissions = req.body;
    
    const authService = require("../services/authService");
    const user = await authService.updateUserPermissions(req, id, permissions);
    res.json({ ok: true, data: user });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ ok: false, message: error.message });
    }
    if (error.status === 400) {
      return res.status(400).json({ ok: false, message: error.message });
    }
    next(error);
  }
};

