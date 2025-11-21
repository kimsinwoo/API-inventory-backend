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
 * 역할 상세 조회 (UserProfile ID 또는 User ID로 조회)
 */
exports.show = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // User ID인 경우 UserProfile을 찾아서 처리
    const db = req.app.get("db");
    const user = await db.User.findByPk(id, {
      include: [{
        model: db.UserProfile,
        as: "UserProfile",
      }],
    });
    
    let profileId = id;
    if (user && user.UserProfile) {
      profileId = user.UserProfile.id;
    }
    
    const role = await roleService.getRoleById(profileId);
    if (!role) {
      return res.status(404).json({ ok: false, message: "사용자 프로필을 찾을 수 없습니다" });
    }
    res.json({ ok: true, data: role });
  } catch (error) {
    next(error);
  }
};

/**
 * 역할 생성 (UserProfile은 사용자 생성 시 함께 생성되므로 이 API는 사용하지 않음)
 */
exports.create = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body);
    res.status(201).json({ ok: true, data: role });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ ok: false, message: error.message });
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ ok: false, message: "이미 존재하는 사용자입니다" });
    }
    next(error);
  }
};

/**
 * 역할 수정 (UserProfile 권한 수정)
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // User ID인 경우 UserProfile을 찾아서 처리
    const db = req.app.get("db");
    const user = await db.User.findByPk(id, {
      include: [{
        model: db.UserProfile,
        as: "UserProfile",
      }],
    });
    
    let profileId = id;
    if (user && user.UserProfile) {
      profileId = user.UserProfile.id;
    }
    
    const role = await roleService.updateRole(profileId, req.body);
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
 * 역할 삭제 (UserProfile 삭제 - 실제로는 사용자 삭제 API 사용 권장)
 */
exports.destroy = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // User ID인 경우 UserProfile을 찾아서 처리
    const db = req.app.get("db");
    const user = await db.User.findByPk(id, {
      include: [{
        model: db.UserProfile,
        as: "UserProfile",
      }],
    });
    
    let profileId = id;
    if (user && user.UserProfile) {
      profileId = user.UserProfile.id;
    }
    
    await roleService.deleteRole(profileId);
    res.json({ ok: true, message: "사용자 프로필이 삭제되었습니다" });
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
 * :id는 User ID 또는 UserProfile ID를 의미합니다
 */
exports.updatePermission = async (req, res, next) => {
  try {
    const { id, permissionName } = req.params;
    const { value } = req.body;
    
    const db = req.app.get("db");
    // User ID로 먼저 시도
    let user = await db.User.findByPk(id, {
      include: [{
        model: db.UserProfile,
        as: "UserProfile",
      }],
    });
    
    // User를 찾지 못한 경우 UserProfile ID로 시도
    if (!user) {
      const profile = await db.UserProfile.findByPk(id);
      if (profile) {
        user = await db.User.findOne({
          where: { profile_id: profile.id },
          include: [{
            model: db.UserProfile,
            as: "UserProfile",
          }],
        });
      }
    }
    
    if (!user || !user.UserProfile) {
      return res.status(404).json({ ok: false, message: "사용자를 찾을 수 없습니다" });
    }
    
    const authService = require("../services/authService");
    const permissions = { [permissionName]: value };
    const updatedUser = await authService.updateUserPermissions(req, user.id, permissions);
    res.json({ ok: true, data: updatedUser });
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
 * :id는 User ID 또는 UserProfile ID를 의미합니다
 */
exports.updatePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const permissions = req.body;
    
    const db = req.app.get("db");
    // User ID로 먼저 시도
    let user = await db.User.findByPk(id, {
      include: [{
        model: db.UserProfile,
        as: "UserProfile",
      }],
    });
    
    // User를 찾지 못한 경우 UserProfile ID로 시도
    if (!user) {
      const profile = await db.UserProfile.findByPk(id);
      if (profile) {
        user = await db.User.findOne({
          where: { profile_id: profile.id },
          include: [{
            model: db.UserProfile,
            as: "UserProfile",
          }],
        });
      }
    }
    
    if (!user || !user.UserProfile) {
      return res.status(404).json({ ok: false, message: "사용자를 찾을 수 없습니다" });
    }
    
    const authService = require("../services/authService");
    const updatedUser = await authService.updateUserPermissions(req, user.id, permissions);
    res.json({ ok: true, data: updatedUser });
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

