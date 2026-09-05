/**
 * Payroll Formula Engine
 * Safe tokenizer, recursive-descent parser, and AST evaluator for payroll salary rules.
 * Specifications: 16-PAYROLL-FORMULA-ENGINE.md §§5–7
 */

const APPROVED_FUNCTIONS = new Set(["MAX", "MIN", "ROUND", "ABS", "IF"]);

class FormulaError extends Error {
  constructor(message) {
    super(message);
    this.name = "FormulaError";
    this.statusCode = 400;
  }
}

/**
 * Tokenize mathematical expression string
 */
function tokenize(expression) {
  if (typeof expression !== "string") {
    throw new FormulaError("Expression must be a string");
  }

  const tokens = [];
  let i = 0;
  const len = expression.length;

  while (i < len) {
    const ch = expression[i];

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Numbers (integer or floating point)
    if (/\d/.test(ch) || (ch === "." && i + 1 < len && /\d/.test(expression[i + 1]))) {
      let numStr = "";
      while (i < len && (/[\d.]/.test(expression[i]))) {
        numStr += expression[i];
        i++;
      }
      const num = Number(numStr);
      if (isNaN(num)) {
        throw new FormulaError(`Invalid numeric literal: ${numStr}`);
      }
      tokens.push({ type: "Number", value: num });
      continue;
    }

    // Identifiers and Function names
    if (/[A-Za-z_]/.test(ch)) {
      let ident = "";
      while (i < len && /[A-Za-z0-9_]/.test(expression[i])) {
        ident += expression[i];
        i++;
      }
      tokens.push({ type: "Identifier", name: ident });
      continue;
    }

    // Two-character operators
    const next2 = expression.slice(i, i + 2);
    if (["==", "!=", ">=", "<="].includes(next2)) {
      tokens.push({ type: "Operator", value: next2 });
      i += 2;
      continue;
    }

    // Single-character operators and delimiters
    if (["+", "-", "*", "/", "%", ">", "<", "(", ")", ","].includes(ch)) {
      tokens.push({
        type: ["(", ")", ","].includes(ch) ? "Delimiter" : "Operator",
        value: ch,
      });
      i++;
      continue;
    }

    throw new FormulaError(`Unexpected character in formula: '${ch}'`);
  }

  return tokens;
}

/**
 * Recursive-descent parser producing AST
 */
function parse(tokens) {
  let pos = 0;

  function peek() {
    return tokens[pos] || null;
  }

  function consume(expectedType = null, expectedValue = null) {
    const token = tokens[pos];
    if (!token) {
      throw new FormulaError("Unexpected end of expression");
    }
    if (expectedType && token.type !== expectedType) {
      throw new FormulaError(`Expected token type ${expectedType} but got ${token.type}`);
    }
    if (expectedValue && token.value !== expectedValue) {
      throw new FormulaError(`Expected '${expectedValue}' but got '${token.value}'`);
    }
    pos++;
    return token;
  }

  function parseComparison() {
    let left = parseExpression();
    const token = peek();

    if (token && token.type === "Operator" && [">", "<", ">=", "<=", "==", "!="].includes(token.value)) {
      const op = consume("Operator").value;
      const right = parseExpression();
      left = { type: "BinaryOp", op, left, right };
    }

    return left;
  }

  function parseExpression() {
    let left = parseTerm();

    while (true) {
      const token = peek();
      if (token && token.type === "Operator" && (token.value === "+" || token.value === "-")) {
        const op = consume("Operator").value;
        const right = parseTerm();
        left = { type: "BinaryOp", op, left, right };
      } else {
        break;
      }
    }

    return left;
  }

  function parseTerm() {
    let left = parseFactor();

    while (true) {
      const token = peek();
      if (token && token.type === "Operator" && ["*", "/", "%"].includes(token.value)) {
        const op = consume("Operator").value;
        const right = parseFactor();
        left = { type: "BinaryOp", op, left, right };
      } else {
        break;
      }
    }

    return left;
  }

  function parseFactor() {
    const token = peek();
    if (!token) {
      throw new FormulaError("Unexpected end of expression");
    }

    // Unary minus
    if (token.type === "Operator" && token.value === "-") {
      consume("Operator", "-");
      const operand = parseFactor();
      return { type: "UnaryMinus", operand };
    }

    // Unary plus
    if (token.type === "Operator" && token.value === "+") {
      consume("Operator", "+");
      return parseFactor();
    }

    // Parenthesized expression
    if (token.type === "Delimiter" && token.value === "(") {
      consume("Delimiter", "(");
      const expr = parseComparison();
      consume("Delimiter", ")");
      return expr;
    }

    // Number literal
    if (token.type === "Number") {
      consume("Number");
      return { type: "Number", value: token.value };
    }

    // Identifier or Function call
    if (token.type === "Identifier") {
      const identToken = consume("Identifier");
      const next = peek();

      if (next && next.type === "Delimiter" && next.value === "(") {
        // Function call
        const funcName = identToken.name.toUpperCase();
        if (!APPROVED_FUNCTIONS.has(funcName)) {
          throw new FormulaError(`Unapproved function call: ${identToken.name}`);
        }

        consume("Delimiter", "(");
        const args = [];

        if (peek() && !(peek().type === "Delimiter" && peek().value === ")")) {
          args.push(parseComparison());
          while (peek() && peek().type === "Delimiter" && peek().value === ",") {
            consume("Delimiter", ",");
            args.push(parseComparison());
          }
        }

        consume("Delimiter", ")");

        if (["MAX", "MIN"].includes(funcName) && args.length !== 2) {
          throw new FormulaError(`${funcName} requires exactly 2 arguments`);
        }
        if (funcName === "ROUND" && (args.length < 1 || args.length > 2)) {
          throw new FormulaError("ROUND requires 1 or 2 arguments");
        }
        if (funcName === "ABS" && args.length !== 1) {
          throw new FormulaError("ABS requires exactly 1 argument");
        }
        if (funcName === "IF" && args.length !== 3) {
          throw new FormulaError("IF requires exactly 3 arguments (condition, thenVal, elseVal)");
        }

        return { type: "FunctionCall", name: funcName, args };
      }

      return { type: "Identifier", name: identToken.name };
    }

    throw new FormulaError(`Unexpected token: ${JSON.stringify(token)}`);
  }

  const ast = parseComparison();

  if (pos < tokens.length) {
    throw new FormulaError(`Unexpected token after expression: ${JSON.stringify(tokens[pos])}`);
  }

  return ast;
}

/**
 * Evaluates parsed AST against variable context
 */
function evaluateAst(node, context = {}) {
  switch (node.type) {
    case "Number":
      return node.value;

    case "Identifier": {
      const varName = node.name;
      if (!(varName in context)) {
        throw new FormulaError(`Unknown variable: ${varName}`);
      }
      const val = context[varName];
      if (typeof val !== "number" && typeof val !== "boolean") {
        throw new FormulaError(`Variable '${varName}' must be a number or boolean, got ${typeof val}`);
      }
      return val;
    }

    case "UnaryMinus":
      return -evaluateAst(node.operand, context);

    case "BinaryOp": {
      const l = evaluateAst(node.left, context);
      const r = evaluateAst(node.right, context);

      switch (node.op) {
        case "+":
          return l + r;
        case "-":
          return l - r;
        case "*":
          return l * r;
        case "/":
          return r === 0 ? 0 : l / r;
        case "%":
          return r === 0 ? 0 : l % r;
        case ">":
          return l > r ? 1 : 0;
        case "<":
          return l < r ? 1 : 0;
        case ">=":
          return l >= r ? 1 : 0;
        case "<=":
          return l <= r ? 1 : 0;
        case "==":
          return l === r ? 1 : 0;
        case "!=":
          return l !== r ? 1 : 0;
        default:
          throw new FormulaError(`Unsupported binary operator: ${node.op}`);
      }
    }

    case "FunctionCall": {
      switch (node.name) {
        case "MAX": {
          const a = evaluateAst(node.args[0], context);
          const b = evaluateAst(node.args[1], context);
          return Math.max(a, b);
        }
        case "MIN": {
          const a = evaluateAst(node.args[0], context);
          const b = evaluateAst(node.args[1], context);
          return Math.min(a, b);
        }
        case "ROUND": {
          const x = evaluateAst(node.args[0], context);
          const decimals = node.args.length > 1 ? evaluateAst(node.args[1], context) : 0;
          return Number(x.toFixed(Math.max(0, Math.round(decimals))));
        }
        case "ABS": {
          const x = evaluateAst(node.args[0], context);
          return Math.abs(x);
        }
        case "IF": {
          const cond = evaluateAst(node.args[0], context);
          const isTruthy = Boolean(cond);
          return isTruthy
            ? evaluateAst(node.args[1], context)
            : evaluateAst(node.args[2], context);
        }
        default:
          throw new FormulaError(`Unsupported function: ${node.name}`);
      }
    }

    default:
      throw new FormulaError(`Invalid AST node type: ${node.type}`);
  }
}

/**
 * Recursively extracts all Identifier variable names from AST
 */
function extractIdentifiersFromAst(node, set = new Set()) {
  if (!node) return set;

  if (node.type === "Identifier") {
    set.add(node.name);
  } else if (node.type === "UnaryMinus") {
    extractIdentifiersFromAst(node.operand, set);
  } else if (node.type === "BinaryOp") {
    extractIdentifiersFromAst(node.left, set);
    extractIdentifiersFromAst(node.right, set);
  } else if (node.type === "FunctionCall" && Array.isArray(node.args)) {
    for (const arg of node.args) {
      extractIdentifiersFromAst(arg, set);
    }
  }

  return set;
}

/**
 * Public evaluate function (takes expression string or AST)
 */
exports.evaluate = (expressionOrAst, context = {}) => {
  let ast = expressionOrAst;
  if (typeof expressionOrAst === "string") {
    const tokens = tokenize(expressionOrAst);
    ast = parse(tokens);
  }
  const result = evaluateAst(ast, context);
  return typeof result === "number" ? Math.round(result * 100) / 100 : result;
};

/**
 * Validates formula syntax and returns referenced variable identifiers
 */
exports.validateFormula = (expression) => {
  const tokens = tokenize(expression);
  const ast = parse(tokens);
  const identifiers = Array.from(extractIdentifiersFromAst(ast));
  return { valid: true, identifiers, ast };
};

exports.tokenize = tokenize;
exports.parse = parse;
exports.extractIdentifiersFromAst = extractIdentifiersFromAst;
exports.FormulaError = FormulaError;
exports.APPROVED_FUNCTIONS = Array.from(APPROVED_FUNCTIONS);
