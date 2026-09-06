const SalaryRule = require("../models/SalaryRule");
const formulaEngine = require("./formulaEngine.service");

/**
 * Validates fields according to computationMethod
 */
const validateRuleFields = (data) => {
  const method = data.computationMethod;

  if (method === "Fixed") {
    if (data.fixedAmount === undefined || data.fixedAmount === null || isNaN(Number(data.fixedAmount))) {
      const err = new Error("Fixed computation method requires fixedAmount");
      err.statusCode = 400;
      throw err;
    }
    data.percentageOf = null;
    data.percentageValue = null;
    data.formulaExpression = null;
  } else if (method === "Percentage") {
    if (!data.percentageOf) {
      const err = new Error("Percentage computation method requires percentageOf (e.g. 'BASIC' or 'CONTRACT_WAGE')");
      err.statusCode = 400;
      throw err;
    }
    if (data.percentageValue === undefined || data.percentageValue === null || isNaN(Number(data.percentageValue))) {
      const err = new Error("Percentage computation method requires numeric percentageValue");
      err.statusCode = 400;
      throw err;
    }
    data.fixedAmount = null;
    data.formulaExpression = null;
  } else if (method === "Formula") {
    if (!data.formulaExpression || typeof data.formulaExpression !== "string" || !data.formulaExpression.trim()) {
      const err = new Error("Formula computation method requires formulaExpression");
      err.statusCode = 400;
      throw err;
    }
    // Parse-check formula syntax
    formulaEngine.validateFormula(data.formulaExpression);

    data.fixedAmount = null;
    data.percentageOf = null;
    data.percentageValue = null;
  }
};

exports.list = async (query = {}) => {
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;
  if (query.computationMethod) filter.computationMethod = query.computationMethod;

  return SalaryRule.find(filter).sort({ sequence: 1, name: 1 });
};

exports.getById = async (id) => {
  return SalaryRule.findById(id);
};

exports.getByCode = async (code) => {
  if (!code) return null;
  return SalaryRule.findOne({ code: code.toUpperCase() });
};

exports.create = async (data) => {
  if (data.code) {
    data.code = data.code.toUpperCase();
    const existing = await SalaryRule.findOne({ code: data.code });
    if (existing) {
      const err = new Error("This rule code is already in use. Try a different code.");
      err.statusCode = 409;
      err.field = "code";
      err.errors = { code: "This rule code is already in use. Try a different code." };
      throw err;
    }
  }
  validateRuleFields(data);

  const rule = new SalaryRule(data);
  try {
    await rule.save();
  } catch (dbErr) {
    if (dbErr.code === 11000) {
      const err = new Error("This rule code is already in use. Try a different code.");
      err.statusCode = 409;
      err.field = "code";
      err.errors = { code: "This rule code is already in use. Try a different code." };
      throw err;
    }
    throw dbErr;
  }
  return rule;
};

exports.update = async (id, data) => {
  const existing = await SalaryRule.findById(id);
  if (!existing) {
    const err = new Error("Salary rule not found");
    err.statusCode = 404;
    throw err;
  }

  const merged = {
    ...existing.toObject(),
    ...data,
  };

  if (data.computationMethod || data.fixedAmount || data.percentageOf || data.percentageValue || data.formulaExpression) {
    validateRuleFields(merged);
  }

  if (data.code) {
    merged.code = data.code.toUpperCase();
    const duplicate = await SalaryRule.findOne({
      code: merged.code,
      _id: { $ne: id },
    });
    if (duplicate) {
      const err = new Error("This rule code is already in use. Try a different code.");
      err.statusCode = 409;
      err.field = "code";
      err.errors = { code: "This rule code is already in use. Try a different code." };
      throw err;
    }
  }

  try {
    const updated = await SalaryRule.findByIdAndUpdate(id, merged, {
      new: true,
      runValidators: true,
    });
    return updated;
  } catch (dbErr) {
    if (dbErr.code === 11000) {
      const err = new Error("This rule code is already in use. Try a different code.");
      err.statusCode = 409;
      err.field = "code";
      err.errors = { code: "This rule code is already in use. Try a different code." };
      throw err;
    }
    throw dbErr;
  }
};

exports.delete = async (id) => {
  const rule = await SalaryRule.findByIdAndDelete(id);
  if (!rule) {
    const err = new Error("Salary rule not found");
    err.statusCode = 404;
    throw err;
  }
  return rule;
};
