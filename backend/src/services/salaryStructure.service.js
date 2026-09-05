const SalaryStructure = require("../models/SalaryStructure");
const SalaryRule = require("../models/SalaryRule");
const formulaEngine = require("./formulaEngine.service");

/**
 * Validates array ordering and prevents circular / forward dependencies in a structure
 * Specification: 16-PAYROLL-FORMULA-ENGINE.md §7
 */
const validateStructureRules = async (ruleIds) => {
  if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
    return;
  }

  // Check for duplicate rules in the structure
  const stringIds = ruleIds.map((id) => id.toString());
  const uniqueIds = new Set(stringIds);
  if (uniqueIds.size !== stringIds.length) {
    const err = new Error("Structure cannot contain duplicate salary rules");
    err.statusCode = 400;
    throw err;
  }

  // Fetch all rules
  const rules = await SalaryRule.find({ _id: { $in: ruleIds } });
  if (rules.length !== ruleIds.length) {
    const err = new Error("One or more referenced salary rules do not exist");
    err.statusCode = 400;
    throw err;
  }

  const ruleMap = new Map(rules.map((r) => [r._id.toString(), r]));
  const orderedRules = stringIds.map((id) => ruleMap.get(id));

  // Recognized global context variables that can be referenced anywhere
  const globalVars = new Set([
    "CONTRACT_WAGE",
    "WORKED_DAYS",
    "TOTAL_WORKING_DAYS",
    "SCHEDULED_DAYS",
    "PAID_LEAVE_DAYS",
    "UNPAID_LEAVE_DAYS",
    "OVERTIME_HOURS",
  ]);

  const seenRuleCodes = new Set(globalVars);

  for (let i = 0; i < orderedRules.length; i++) {
    const rule = orderedRules[i];

    if (rule.computationMethod === "Percentage") {
      const ref = (rule.percentageOf || "").toUpperCase();
      if (!seenRuleCodes.has(ref)) {
        const err = new Error(
          `Sequence validation failed: Rule '${rule.code}' at index ${i} references '${ref}', which must appear earlier in the structure's rules array`
        );
        err.statusCode = 400;
        throw err;
      }
    } else if (rule.computationMethod === "Formula" && rule.formulaExpression) {
      const { identifiers } = formulaEngine.validateFormula(rule.formulaExpression);
      for (const ident of identifiers) {
        if (!seenRuleCodes.has(ident.toUpperCase())) {
          const err = new Error(
            `Sequence validation failed: Rule '${rule.code}' at index ${i} formula references '${ident}', which must appear earlier in the structure's rules array or be a valid global variable`
          );
          err.statusCode = 400;
          throw err;
        }
      }
    }

    seenRuleCodes.add(rule.code.toUpperCase());
  }
};

exports.list = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;

  return SalaryStructure.find(filter)
    .populate("rules")
    .sort({ name: 1 });
};

exports.getById = async (id) => {
  return SalaryStructure.findById(id).populate("rules");
};

exports.create = async (data) => {
  if (data.rules) {
    await validateStructureRules(data.rules);
  }

  const structure = new SalaryStructure(data);
  await structure.save();
  return exports.getById(structure._id);
};

exports.update = async (id, data) => {
  const existing = await SalaryStructure.findById(id);
  if (!existing) {
    const err = new Error("Salary structure not found");
    err.statusCode = 404;
    throw err;
  }

  if (data.rules) {
    await validateStructureRules(data.rules);
  }

  const updated = await SalaryStructure.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate("rules");

  return updated;
};

exports.delete = async (id) => {
  const structure = await SalaryStructure.findByIdAndDelete(id);
  if (!structure) {
    const err = new Error("Salary structure not found");
    err.statusCode = 404;
    throw err;
  }
  return structure;
};
