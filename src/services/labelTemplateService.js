const db = require("../../models");
const { LabelTemplate } = db;

exports.createTemplate = async (payload) => {
  return LabelTemplate.create({
    item_id: payload.itemId ?? null,
    item_name: payload.itemName ?? null,
    label_type: payload.labelType ?? null,
    storage_condition: payload.storageCondition ?? null,
    registration_number: payload.registrationNumber ?? null,
    category_and_form: payload.categoryAndForm ?? null,
    ingredients: payload.ingredients ?? null,
    raw_materials: payload.rawMaterials ?? null,
    actual_weight: payload.actualWeight ?? null,
    html_content: payload.htmlContent,
    printer_name: payload.printerName ?? null,
    print_count: payload.printCount ?? 1,
    print_status: payload.printStatus ?? "PENDING",
    error_message: payload.errorMessage ?? null,
  });
};

exports.markResult = async (templateId, { success, errorMessage }) => {
  if (!templateId) return null;

  const template = await LabelTemplate.findByPk(templateId);
  if (!template) return null;

  template.print_status = success ? "SUCCESS" : "FAILED";
  template.error_message = errorMessage ?? null;
  return template.save();
};

