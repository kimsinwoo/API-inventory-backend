"use strict";

module.exports = (models) => {
  const svc = require("../services/approvalService")(models);

  return {
    create: async (req, res) => {
      const me = req.user;
      const { formCode, title, payload, attachments } = req.body || {};

      if (!formCode) {
        return res.status(400).json({ ok: false, message: "formCode는 필수입니다." });
      }

      try {
        const approval = await svc.create({
          formCode,
          title,
          payload: payload || {},
          createdByUserId: me.id,
          attachments: attachments || [],
        });
        return res.status(201).json({ ok: true, message: "결재가 생성되었습니다", data: approval });
      } catch (error) {
        return res.status(400).json({ ok: false, message: error.message });
      }
    },

    inbox: async (req, res) => {
      const me = req.user;
      const list = await svc.inbox(me.id, me.roleCode);
      return res.json({ ok: true, data: list });
    },

    detail: async (req, res) => {
      const id = Number(req.params.id);
      const row = await models.Approval.findByPk(id, {
        include: [{ model: models.ApprovalTask }, { model: models.ApprovalData }, { model: models.Attachment }],
      });
      if (!row) return res.status(404).json({ ok: false, message: "NOT_FOUND" });
      return res.json({ ok: true, data: row });
    },

    approve: async (req, res) => {
      const me = req.user;
      const approvalId = Number(req.params.id);
      let { signatureImagePath, comment, useDefaultSignature } = req.body || {};
      
      // useDefaultSignature가 true이고 signatureImagePath가 없으면 사용자의 기본 도장 사용 (주석처리)
      // if (useDefaultSignature && !signatureImagePath) {
      //   const authSvc = require("../services/authService");
      //   const userSignature = await authSvc.getUserSignature(req, me.id);
      //   if (userSignature) {
      //     signatureImagePath = userSignature;
      //   }
      // }
      
      await svc.approve({ approvalId, actorUserId: me.id, actorRoleCode: me.roleCode, signatureImagePath, comment });
      return res.json({ ok: true });
    },

    reject: async (req, res) => {
      const me = req.user;
      const approvalId = Number(req.params.id);
      const { comment } = req.body || {};
      await svc.reject({ approvalId, actorUserId: me.id, actorRoleCode: me.roleCode, comment });
      return res.json({ ok: true });
    },
  };
};
