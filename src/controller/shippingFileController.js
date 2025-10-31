const path = require("path");
const fs = require("fs");
const shippingFileService = require("../services/shippingFileService");

exports.upload = async (req, res) => {
  const { validatedIssueType: issueType, validatedSource: source } = req;
  const groupId = req.body.groupId;
  const files = req.files || (req.file ? [req.file] : []);

  if (!files || files.length === 0) {
    return res.status(400).json({ ok: false, message: "업로드할 파일이 없습니다" });
  }

  const result = await shippingFileService.uploadFiles({ files, issueType, source, groupId });
  return res.status(200).json({ ok: true, message: "업로드 되었습니다", data: result });
};

exports.save = async (req, res) => {
  const { groupId } = req.body;
  if (!groupId) {
    return res.status(400).json({ ok: false, message: "groupId는 필수입니다" });
  }
  const result = await shippingFileService.saveGroup({ groupId });
  return res.status(200).json({ ok: true, message: "저장되었습니다", data: result });
};

exports.list = async (req, res) => {
  const issueType = (req.query.issueType || "").toUpperCase();
  if (!issueType || !["B2B", "B2C"].includes(issueType)) {
    return res.status(400).json({ ok: false, message: "issueType은 B2B 또는 B2C" });
  }
  const result = await shippingFileService.listGroups({ issueType });
  return res.status(200).json({ ok: true, data: result });
};

exports.download = async (req, res) => {
  const { groupId } = req.params;
  const format = (req.query.format || "cj").toLowerCase();
  const result = await shippingFileService.downloadGroup({ groupId, format });
  return res.download(result.outputPath, result.fileName);
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  const out = await shippingFileService.deleteFileById(id);
  if (!out.ok) {
    return res.status(404).json({ ok: false, message: "파일을 찾을 수 없습니다" });
  }
  return res.status(200).json({ ok: true, message: "삭제되었습니다" });
};


