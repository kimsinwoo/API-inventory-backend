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

      // 사용자 정보 가져오기 (UserProfile의 권한을 직접 체크)
      let user = req.user;
      let userProfile = null;

      // req.user에 profile이 없거나 UserProfile 객체가 아닌 경우 DB에서 조회
      if (!user || !user.profile || !user.profile.id) {
        // User와 UserProfile을 함께 조회 (권한 필드 포함)
        user = await User.findByPk(userId, {
          include: [
            {
              model: UserProfile,
              as: "UserProfile",
              required: true, // INNER JOIN으로 UserProfile이 반드시 있어야 함
              attributes: [
                'id', 'full_name', 'phone_number', 'email', 'hire_date', 
                'position', 'department', 'role',
                'can_basic_info', 'can_receiving', 'can_plant1_preprocess',
                'can_plant_transfer', 'can_plant2_manufacture', 'can_shipping',
                'can_label', 'can_inventory', 'can_quality', 'can_user_management',
                'created_at', 'updated_at'
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

        userProfile = user.UserProfile;

        req.user = {
          id: user.id,
          profile_id: user.profile_id,
          profile: userProfile,
        };
      } else {
        userProfile = req.user.profile;
        
        // UserProfile이 있지만 권한 필드가 없는 경우 다시 조회
        if (userProfile && (!userProfile.hasOwnProperty('can_basic_info') && !userProfile.dataValues?.can_basic_info)) {
          userProfile = await UserProfile.findByPk(userProfile.id, {
            attributes: [
              'id', 'full_name', 'phone_number', 'email', 'hire_date', 
              'position', 'department', 'role',
              'can_basic_info', 'can_receiving', 'can_plant1_preprocess',
              'can_plant_transfer', 'can_plant2_manufacture', 'can_shipping',
              'can_label', 'can_inventory', 'can_quality', 'can_user_management',
              'created_at', 'updated_at'
            ],
          });
          req.user.profile = userProfile;
        }
      }

      // UserProfile이 없으면 기본 권한 없음
      if (!userProfile) {
        console.error(`[Permission] UserProfile is null: userId=${userId}, profileId=${req.user?.profile_id}`);
        return res.status(403).json({
          ok: false,
          message: "권한이 없습니다 (사용자 프로필이 설정되지 않았습니다)",
        });
      }

      // 권한 체크 (UserProfile의 권한 필드를 직접 체크)
      const profileData = userProfile.dataValues || userProfile;
      const hasPermission = profileData[permissionName] === true || profileData[permissionName] === 1;
      
      // 디버깅 로그
      if (!hasPermission) {
        console.warn(`[Permission] Permission denied: userId=${userId}, profileId=${profileData.id}, userName=${profileData.full_name}, permission=${permissionName}, value=${profileData[permissionName]}`);
        console.warn(`[Permission] UserProfile data:`, JSON.stringify(profileData, null, 2));
      }

      if (!hasPermission) {
        return res.status(403).json({
          ok: false,
          message: `'${permissionName}' 권한이 없습니다`,
          debug: {
            userId: userId,
            profileId: profileData.id,
            userName: profileData.full_name,
            permission: permissionName,
            hasPermission: false,
            permissionValue: profileData[permissionName],
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

