const path = require("path");
const fs = require("fs");
const { sequelize } = require("../../models");
const db = require("../../models");
const orderImportService = require("./orderImportService");

const UPLOAD_ROOT = path.join(__dirname, "../../uploads/order-imports");
const OUTPUT_ROOT = path.join(__dirname, "../../uploads/order-outputs");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateGroupId() {
  return `grp_${Date.now()}_${Math.round(Math.random() * 1e9)}`;
}

function calcExpiresAt() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

async function cleanupExpired() {
  const { shippingfile: ShippingFile } = db;
  const now = new Date();
  const expired = await ShippingFile.findAll({ where: { expiresAt: { [db.Sequelize.Op.lt]: now } } });
  for (const rec of expired) {
    try {
      if (rec.path && fs.existsSync(rec.path)) {
        fs.unlinkSync(rec.path);
      }
    } catch (_) {}
  }
  if (expired.length > 0) {
    await ShippingFile.destroy({ where: { id: expired.map((r) => r.id) } });
  }
}

async function uploadFiles({ files, issueType, source, groupId }) {
  await cleanupExpired();
  const { shippingfile: ShippingFile } = db;

  const useGroupId = groupId || generateGroupId();
  const records = [];
  for (const f of files) {
    const rec = await ShippingFile.create({
      groupId: useGroupId,
      issueType,
      source,
      originalName: f.originalname,
      storedName: path.basename(f.path),
      path: f.path,
      size: f.size || 0,
      status: "TEMP",
      expiresAt: calcExpiresAt(),
    });
    records.push(rec);
  }
  return { groupId: useGroupId, files: records };
}

async function saveGroup({ groupId }) {
  await cleanupExpired();
  const { shippingfile: ShippingFile } = db;
  await ShippingFile.update({ status: "SAVED" }, { where: { groupId } });
  const list = await ShippingFile.findAll({ where: { groupId } });
  return { groupId, count: list.length };
}

async function listGroups({ issueType }) {
  await cleanupExpired();
  const { shippingfile: ShippingFile } = db;
  const rows = await ShippingFile.findAll({
    where: { issueType },
    order: [["createdAt", "DESC"]],
  });
  const groups = {};
  for (const r of rows) {
    if (!groups[r.groupId]) groups[r.groupId] = [];
    groups[r.groupId].push(r);
  }
  return Object.entries(groups).map(([gid, arr]) => ({
    groupId: gid,
    issueType,
    count: arr.length,
    createdAt: arr[0].createdAt,
    expiresAt: arr[0].expiresAt,
    sources: Array.from(new Set(arr.map((x) => x.source))),
    files: arr.map((x) => ({ id: x.id, originalName: x.originalName, storedName: x.storedName, size: x.size, status: x.status })),
  }));
}

async function deleteFileById(id) {
  const { shippingfile: ShippingFile } = db;
  const rec = await ShippingFile.findByPk(id);
  if (!rec) return { ok: false };
  try {
    if (rec.path && fs.existsSync(rec.path)) {
      fs.unlinkSync(rec.path);
    }
  } catch (_) {}
  await ShippingFile.destroy({ where: { id } });
  return { ok: true };
}

async function downloadGroup({ groupId, format = "cj" }) {
  await cleanupExpired();
  ensureDir(OUTPUT_ROOT);
  const { shippingfile: ShippingFile } = db;
  const files = await ShippingFile.findAll({ where: { groupId } });
  if (!files || files.length === 0) {
    const err = new Error("그룹에 파일이 없습니다");
    err.status = 404;
    throw err;
  }

  const tempFiles = files.map((r) => ({ path: r.path, originalname: r.originalName }));
  const merged = [];
  for (const f of tempFiles) {
    try {
      const result = await orderImportService.processSingleFile(f.path);
      merged.push(...result.data);
    } catch (e) {}
  }

  const mergedData = orderImportService.mergeOrderData(merged);

  let fileName;
  let outputPath;
  if (format === "standard") {
    fileName = `통합주문내역_${groupId}_${Date.now()}.xlsx`;
    outputPath = path.join(OUTPUT_ROOT, fileName);
    orderImportService.saveToExcel(mergedData, outputPath);
  } else {
    fileName = `CJ대한통운_업로드_${groupId}_${Date.now()}.xlsx`;
    outputPath = path.join(OUTPUT_ROOT, fileName);
    orderImportService.saveToCJExcel(mergedData, outputPath);
  }

  return { fileName, outputPath };
}

module.exports = {
  uploadFiles,
  saveGroup,
  listGroups,
  deleteFileById,
  downloadGroup,
  cleanupExpired,
};


