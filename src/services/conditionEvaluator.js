"use strict";

// true(서명 필요) / false(생략)
function cmpNumber(v, c) {
  if (c.lt !== undefined && !(v < c.lt)) return false;
  if (c.lte !== undefined && !(v <= c.lte)) return false;
  if (c.gt !== undefined && !(v > c.gt)) return false;
  if (c.gte !== undefined && !(v >= c.gte)) return false;
  if (c.eq !== undefined && !(v === c.eq)) return false;
  return true;
}

function evaluateConditions(required, conditions, payload, context) {
  if (!conditions) return !!required;

  let ok = true;
  for (const key of Object.keys(conditions)) {
    const rule = conditions[key];

    if (key === "amount") {
      const n = Number(payload?.amount ?? 0);
      ok = ok && cmpNumber(n, rule);
    } else if (key === "category") {
      const arr = Array.isArray(rule) ? rule : [rule];
      ok = ok && arr.includes(payload?.category);
    } else if (key === "department") {
      ok = ok && payload?.department === rule;
    } else if (key === "roleExists") {
      const role = String(rule);
      const exists = !!context?.assignees?.[role]?.length;
      ok = ok && exists;
    } else {
      ok = ok && payload?.[key] === rule;
    }

    if (!ok) break;
  }
  return ok;
}

module.exports = { evaluateConditions };
