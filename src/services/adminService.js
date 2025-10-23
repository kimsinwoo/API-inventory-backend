"use strict";

module.exports = (models) => {
  async function getPayload(approvalId, tx) {
    const rd = await models.ApprovalData.findOne({ where: { approval_id: approvalId }, transaction: tx });
    return rd?.payload || {};
  }

  async function createTasksFromTemplates({ approval, tx }) {
    const templates = await models.User.update({
        authority
    })
  }

  return { getPayload, createTasksFromTemplates, openNextStep, approve, reject, inbox };
};
