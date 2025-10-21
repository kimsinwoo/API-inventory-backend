"use strict";

module.exports = (models) => {
  const svc = require("../services/approvalService")(models);

  return {
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
      const { signatureImagePath, comment } = req.body || {};
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
