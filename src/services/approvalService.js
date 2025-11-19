"use strict";

const { Op } = require("sequelize");
const { evaluateConditions } = require("./conditionEvaluator");

module.exports = (models) => {
  async function getPayload(approvalId, tx) {
    const rd = await models.ApprovalData.findOne({ where: { approval_id: approvalId }, transaction: tx });
    return rd?.payload || {};
  }

  async function createTasksFromTemplates({ approval, tx }) {
    const templates = await models.RequiredApprover.findAll({
      where: { form_code: approval.form_code },
      order: [["order", "ASC"]],
      transaction: tx,
    });

    let i = 1;
    for (const st of templates) {
      await models.ApprovalTask.create(
        {
          approval_id: approval.id,
          required_approver_id: st.id,
          order: i++,
          assignee_role_code: st.role_code,
          assignee_user_id: null,
          status: "WAITING",
        },
        { transaction: tx }
      );
    }
  }

  async function openNextStep(approvalId, actorUserId, tx) {
    const waiting = await models.ApprovalTask.findAll({
      where: { approval_id: approvalId, status: "WAITING" },
      include: [{ model: models.RequiredApprover, required: true }],
      order: [["order", "ASC"]],
      transaction: tx,
    });

    const payload = await getPayload(approvalId, tx);

    for (const t of waiting) {
      const st = t.RequiredApprover;
      const mustSign = evaluateConditions(!!st.required, st.conditions, payload, undefined);

      if (mustSign) {
        await t.update({ status: "REQUESTED" }, { transaction: tx });
        await models.Approval.update(
          { status: "IN_PROGRESS", current_order: t.order },
          { where: { id: approvalId }, transaction: tx }
        );
        await models.AuditLog.create(
          { approval_id: approvalId, approval_task_id: t.id, actor_user_id: actorUserId || null, action: "TASK_REQUESTED", detail: { order: t.order } },
          { transaction: tx }
        );
        return;
      } else {
        await t.update({ status: "AUTO_SKIPPED", signed_at: new Date(), comment: "auto-skip" }, { transaction: tx });
        await models.AuditLog.create(
          { approval_id: approvalId, approval_task_id: t.id, actor_user_id: actorUserId || null, action: "AUTO_SKIPPED" },
          { transaction: tx }
        );
      }
    }

    await models.Approval.update({ status: "APPROVED" }, { where: { id: approvalId }, transaction: tx });
    await models.AuditLog.create(
      { approval_id: approvalId, approval_task_id: null, actor_user_id: actorUserId || null, action: "REQUEST_STATUS_CHANGED", detail: { status: "APPROVED" } },
      { transaction: tx }
    );
  }

  async function approve({ approvalId, actorUserId, actorRoleCode, signatureImagePath, comment }) {
    return await models.Approval.sequelize.transaction(async (tx) => {
      const ap = await models.Approval.findByPk(approvalId, { transaction: tx });
      if (!ap) throw new Error("APPROVAL_NOT_FOUND");

      const task = await models.ApprovalTask.findOne({
        where: {
          approval_id: approvalId,
          order: ap.current_order,
          status: "REQUESTED",
          [Op.or]: [{ assignee_role_code: actorRoleCode }, { assignee_user_id: actorUserId }],
        },
        transaction: tx,
      });
      if (!task) throw new Error("NO_PERMISSION_OR_NOT_YOUR_TURN");

      await task.update(
        { status: "APPROVED", signed_at: new Date(), signature_image_path: signatureImagePath || null, comment: comment || null },
        { transaction: tx }
      );

      await models.AuditLog.create(
        { approval_id: approvalId, approval_task_id: task.id, actor_user_id: actorUserId, action: "TASK_APPROVED", detail: { comment } },
        { transaction: tx }
      );

      await openNextStep(approvalId, actorUserId, tx);
    });
  }

  async function reject({ approvalId, actorUserId, actorRoleCode, comment }) {
    return await models.Approval.sequelize.transaction(async (tx) => {
      const ap = await models.Approval.findByPk(approvalId, { transaction: tx });
      if (!ap) throw new Error("APPROVAL_NOT_FOUND");

      const task = await models.ApprovalTask.findOne({
        where: {
          approval_id: approvalId,
          order: ap.current_order,
          status: "REQUESTED",
          [Op.or]: [{ assignee_role_code: actorRoleCode }, { assignee_user_id: actorUserId }],
        },
        transaction: tx,
      });
      if (!task) throw new Error("NO_PERMISSION_OR_NOT_YOUR_TURN");

      await task.update({ status: "REJECTED", comment: comment || null }, { transaction: tx });
      await models.Approval.update({ status: "REJECTED" }, { where: { id: approvalId }, transaction: tx });
      await models.AuditLog.create(
        { approval_id: approvalId, approval_task_id: task.id, actor_user_id: actorUserId, action: "TASK_REJECTED", detail: { comment } },
        { transaction: tx }
      );
    });
  }

  async function inbox(userId, roleCode) {
    const rows = await models.Approval.findAll({
      where: { status: { [Op.in]: ["PENDING", "IN_PROGRESS"] } },
      include: [
        {
          model: models.ApprovalTask,
          required: true,
          where: {
            status: "REQUESTED",
            [Op.or]: [{ assignee_role_code: roleCode }, { assignee_user_id: userId }],
          },
        },
      ],
      order: [["updated_at", "DESC"]],
    });
    return rows;
  }

  async function create({ formCode, title, payload, createdByUserId, attachments }) {
    return await models.Approval.sequelize.transaction(async (tx) => {
      // 결재 생성
      const approval = await models.Approval.create(
        {
          form_code: formCode,
          title: title || null,
          created_by_user_id: createdByUserId,
          status: "PENDING",
          current_order: 1,
        },
        { transaction: tx }
      );

      // 결재 데이터 저장
      await models.ApprovalData.create(
        {
          approval_id: approval.id,
          payload: payload || {},
        },
        { transaction: tx }
      );

      // 첨부 파일 저장
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          await models.Attachment.create(
            {
              approval_id: approval.id,
              kind: att.kind || "other",
              path: att.path,
              original_name: att.originalName || att.original_name || null,
              meta: att.meta || null,
            },
            { transaction: tx }
          );
        }
      }

      // 결재 태스크 생성
      await createTasksFromTemplates({ approval, tx });

      // 첫 번째 단계 시작
      await openNextStep(approval.id, createdByUserId, tx);

      // 생성된 결재 조회 (관계 포함)
      const createdApproval = await models.Approval.findByPk(approval.id, {
        include: [{ model: models.ApprovalTask }, { model: models.ApprovalData }, { model: models.Attachment }],
        transaction: tx,
      });

      return createdApproval;
    });
  }

  return { getPayload, createTasksFromTemplates, openNextStep, approve, reject, inbox, create };
};
