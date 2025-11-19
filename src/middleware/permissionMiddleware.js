"use strict";

const db = require("../../models");
const { User, UserProfile, Role } = db;

/**
 * 권한 체크 미들웨어
 * @param {string} permissionName - 권한 이름 (예: 'can_basic_info', 'can_receiving')
 */
function requirePermission(permissionName) {
  return async (req, res, next) => {
    try {
      // Development 환경에서는 권한 체크 건너뛰기
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Permission] Development 모드: 권한 체크 건너뛰기 (${permissionName})`);
        return next();
      }

      // 세션에서 userId 가져오기
      let userId = req.session?.userId || req.user?.id;
      
      if (!userId) {
        // Bearer 토큰 방식도 지원
        const auth = req.headers.authorization || "";
        if (auth.startsWith("Bearer ")) {
          userId = auth.replace("Bearer ", "").trim();
        }
      }

      if (!userId) {
        return res.status(401).json({
          ok: false,
          message: "인증이 필요합니다",
        });
      }

      // 사용자 정보 가져오기
      let user = req.user;
      let role = null;

      // req.user에 role이 없거나 Role 객체가 아닌 경우 DB에서 조회
      if (!user || !user.role || typeof user.role !== 'object' || !user.role.id) {
        // User와 UserProfile, Role을 함께 조회
        user = await User.findByPk(userId, {
          include: [
            {
              model: UserProfile,
              as: "UserProfile",
              required: true, // INNER JOIN으로 UserProfile이 반드시 있어야 함
              include: [
                {
                  model: Role,
                  as: "Role",
                  required: false, // LEFT JOIN으로 Role이 없어도 됨 (나중에 직접 조회)
                },
              ],
            },
          ],
        });

        if (!user || !user.UserProfile) {
          console.error(`[Permission] User not found: userId=${userId}`);
          return res.status(401).json({
            ok: false,
            message: "사용자를 찾을 수 없습니다",
          });
        }

        // Role이 include로 조회되지 않았으면 Role ID로 직접 조회
        if (!user.UserProfile.Role && user.UserProfile.role) {
          role = await Role.findByPk(user.UserProfile.role, {
            // 모든 권한 필드를 명시적으로 포함
            attributes: [
              'id', 'name', 'display_name', 'description', 'is_system', 'is_default',
              'can_basic_info', 'can_receiving', 'can_plant1_preprocess',
              'can_plant_transfer', 'can_plant2_manufacture', 'can_shipping',
              'can_label', 'can_inventory', 'can_quality', 'can_user_management',
              'created_at', 'updated_at'
            ],
          });
          
          if (!role) {
            console.error(`[Permission] Role not found: roleId=${user.UserProfile.role}, userId=${userId}`);
            return res.status(403).json({
              ok: false,
              message: "역할을 찾을 수 없습니다",
            });
          }
        } else {
          role = user.UserProfile.Role;
          
          // Role이 있지만 권한 필드가 없는 경우 다시 조회
          if (role && (!role.hasOwnProperty('can_basic_info') && !role.dataValues?.can_basic_info)) {
            role = await Role.findByPk(role.id, {
              attributes: [
                'id', 'name', 'display_name', 'description', 'is_system', 'is_default',
                'can_basic_info', 'can_receiving', 'can_plant1_preprocess',
                'can_plant_transfer', 'can_plant2_manufacture', 'can_shipping',
                'can_label', 'can_inventory', 'can_quality', 'can_user_management',
                'created_at', 'updated_at'
              ],
            });
          }
        }

        req.user = {
          id: user.id,
          profile_id: user.profile_id,
          profile: user.UserProfile,
          role: role,
        };
      } else {
        role = req.user.role;
        
        // Role이 있지만 권한 필드가 없는 경우 다시 조회
        if (role && role.id && (!role.hasOwnProperty('can_basic_info') && !role.dataValues?.can_basic_info)) {
          role = await Role.findByPk(role.id, {
            attributes: [
              'id', 'name', 'display_name', 'description', 'is_system', 'is_default',
              'can_basic_info', 'can_receiving', 'can_plant1_preprocess',
              'can_plant_transfer', 'can_plant2_manufacture', 'can_shipping',
              'can_label', 'can_inventory', 'can_quality', 'can_user_management',
              'created_at', 'updated_at'
            ],
          });
          req.user.role = role;
        }
      }

      // Role이 없으면 기본 권한 없음
      if (!role) {
        console.error(`[Permission] Role is null: userId=${userId}, profileId=${req.user?.profile_id}`);
        return res.status(403).json({
          ok: false,
          message: "권한이 없습니다 (Role이 설정되지 않았습니다)",
        });
      }

      // 권한 체크 (Sequelize 모델 인스턴스의 경우 dataValues 또는 직접 접근)
      const roleData = role.dataValues || role;
      const hasPermission = roleData[permissionName] === true || roleData[permissionName] === 1;
      
      // 디버깅 로그
      if (!hasPermission) {
        console.warn(`[Permission] Permission denied: userId=${userId}, roleId=${roleData.id}, roleName=${roleData.name}, permission=${permissionName}, value=${roleData[permissionName]}`);
        console.warn(`[Permission] Role data:`, JSON.stringify(roleData, null, 2));
      }

      if (!hasPermission) {
        return res.status(403).json({
          ok: false,
          message: `'${permissionName}' 권한이 없습니다`,
          debug: {
            roleId: roleData.id,
            roleName: roleData.name,
            permission: permissionName,
            hasPermission: false,
            permissionValue: roleData[permissionName],
          },
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      console.error("Error stack:", error.stack);
      return res.status(500).json({
        ok: false,
        message: "권한 확인 중 오류가 발생했습니다",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

module.exports = {
  requirePermission,
};

