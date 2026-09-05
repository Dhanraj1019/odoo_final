# 16 — Payroll Formula Engine

## 1. Why This File Exists (Node.js Adaptation Notice)

**The official mockup's Salary Rule computation methods include "Python Code"** as a way to write advanced formulas (attendance-based earnings, overtime, unpaid-leave deductions, multi-rule calculations). This project's backend is **Node.js**, not Python.

**This is a Recommended Implementation Decision, not a deviation from the required business functionality:** instead of executing real Python (which would require spawning an external interpreter — unnecessary complexity and a security risk) or using JavaScript `eval()`/`new Function()` (explicitly forbidden), this project implements a **small, safe, custom expression language** — a Formula Engine — that supports everything the official use cases actually need:

- References to other Salary Rule results by code.
- References to contract wage and attendance-derived values.
- Basic arithmetic, comparisons, and a small set of safe functions.

No arbitrary code of any language is ever executed. Every future AI agent must preserve this constraint.

## 2. Approved Variables

These are the **only** identifiers the engine resolves, injected fresh per Payslip computation:

| Variable | Meaning |
|---|---|
| `CONTRACT_WAGE` | `Contract.wagePerMonth` for the applicable contract |
| `WORKED_DAYS` | Days the employee worked in the period (from Attendance) |
| `UNPAID_LEAVE_DAYS` | Approved leave days in the period where `TimeOffType.isPaid === false` |
| `OVERTIME_HOURS` | Sum of overtime hours in the period (Recommended Implementation Decision: `workedHours` beyond the employee's expected daily schedule hours, summed for the period; `0` if not tracked) |
| `TOTAL_WORKING_DAYS` | Total working days in the period per the employee's Working Schedule |
| `<RULE_CODE>` | The already-computed amount of any **earlier-sequenced** rule in the same structure (e.g., `BASIC`, `HRA`) — resolved from the running computation map described in `15-PAYROLL-ARCHITECTURE.md` §4 |

Any identifier not in this list (or not yet computed because it's sequenced later) causes a **validation error at rule-save time or compute time** — never a silent `undefined`/`NaN`.

## 3. Approved Operators

```
+  -  *  /  %          (arithmetic)
( )                    (grouping)
>  <  >=  <=  ==  !=   (comparison — for use inside IF)
```

No bitwise operators, no assignment operators, no string concatenation (payroll formulas are numeric only).

## 4. Approved Functions

A tiny, explicit whitelist:

| Function | Behavior |
|---|---|
| `MAX(a, b)` | Larger of two values |
| `MIN(a, b)` | Smaller of two values |
| `ROUND(x, n)` | Round `x` to `n` decimal places |
| `ABS(x)` | Absolute value |
| `IF(condition, thenValue, elseValue)` | Conditional — `condition` must use only the approved comparison operators |

No other function names are recognized. There is no mechanism to define new functions from within a formula.

## 5. Grammar (EBNF, Simplified)

```
expression   := term (("+" | "-") term)*
term         := factor (("*" | "/" | "%") factor)*
factor       := NUMBER | IDENTIFIER | functionCall | "(" expression ")" | "-" factor
functionCall := FUNCNAME "(" expression ("," expression)* ")"
condition    := expression COMPARATOR expression
IDENTIFIER   := one of the approved variables or an earlier rule CODE
FUNCNAME     := one of MAX | MIN | ROUND | ABS | IF
```

Example valid formulas:
```
BASIC * 0.20
MAX(BASIC * 0.20, 3000)
ROUND(CONTRACT_WAGE / TOTAL_WORKING_DAYS * WORKED_DAYS, 2)
IF(UNPAID_LEAVE_DAYS > 0, -1 * (CONTRACT_WAGE / TOTAL_WORKING_DAYS) * UNPAID_LEAVE_DAYS, 0)
OVERTIME_HOURS * (BASIC / TOTAL_WORKING_DAYS / 8) * 1.5
```

## 6. Implementation Approach

**Do not use `eval()`, `new Function()`, or any dynamic code-execution primitive.** Implement a real (tiny) tokenizer + recursive-descent parser + evaluator:

```
formulaEngine.service.js
├── tokenize(expressionString) -> Token[]
├── parse(tokens) -> AST
└── evaluate(ast, variableContext) -> number
```

This is a well-understood, ~150-200 line pattern (a basic arithmetic-expression parser is standard CS material) and is fully safe because the evaluator only ever recognizes the exact node types the parser can produce (`NumberLiteral`, `Identifier`, `BinaryOp`, `FunctionCall`, `UnaryMinus`) — there is no code path that reaches into the JS runtime, `require`, `process`, or the file system.

### Evaluator Sketch
```js
function evaluate(node, context) {
  switch (node.type) {
    case "Number": return node.value;
    case "Identifier":
      if (!(node.name in context)) throw new FormulaError(`Unknown variable: ${node.name}`);
      return context[node.name];
    case "UnaryMinus": return -evaluate(node.operand, context);
    case "BinaryOp": {
      const l = evaluate(node.left, context), r = evaluate(node.right, context);
      switch (node.op) {
        case "+": return l + r; case "-": return l - r;
        case "*": return l * r; case "/": return r === 0 ? 0 : l / r;
        case "%": return l % r;
        case ">": return l > r; case "<": return l < r;
        case ">=": return l >= r; case "<=": return l <= r;
        case "==": return l === r; case "!=": return l !== r;
      }
    }
    case "FunctionCall": {
      const args = node.args.map(a => evaluate(a, context));
      switch (node.name) {
        case "MAX": return Math.max(args[0], args[1]);
        case "MIN": return Math.min(args[0], args[1]);
        case "ROUND": return Number(args[0].toFixed(args[1] ?? 0));
        case "ABS": return Math.abs(args[0]);
        case "IF": return args[0] ? args[1] : args[2];
        default: throw new FormulaError(`Unknown function: ${node.name}`);
      }
    }
    default: throw new FormulaError("Invalid expression node");
  }
}
```
(`IF`'s condition argument must itself be a comparison sub-expression evaluated to a boolean-like `0`/`1` or `true`/`false` before this switch — implement `IF` args[0] evaluation as a boolean-producing branch of `evaluate`, not shown fully here for brevity; the key point for any implementing agent is that **all** logic stays inside this switch-based interpreter, never delegated to `eval`.)

## 7. Validation Rules

- **At Salary Rule save time:** tokenize + parse the `formulaExpression`; reject with a `400` if it fails to parse, references an unapproved function name, or contains any character/token outside the grammar (e.g., letters that aren't a recognized identifier, semicolons, brackets, template literals).
- **Circular dependency prevention:** a formula may only reference rule codes that appear **earlier** in the structure's `rules[]` **array order** — this array order is the single source of truth for execution order (see `15-PAYROLL-ARCHITECTURE.md` §4 and `06-DATABASE-DESIGN.md` §12). `SalaryRule.sequence` is **display/default-ordering metadata only** (e.g., a suggested `sequence` value shown when adding a rule to a new structure) and must **never** be used to determine actual execution or validation order — only the rule's numeric index within `SalaryStructure.rules[]` matters. At structure-save time, validate that every `formulaExpression`'s referenced rule-codes have a lower **array index** than the rule itself; reject with a `400` describing the offending rule pair if not. This makes circular references structurally impossible rather than needing runtime cycle detection.
- **At compute time:** if a referenced identifier is missing from the context (defensive double-check), throw a caught `FormulaError` that becomes a Payslip `warning` (e.g., `"Formula error in rule HRA: Unknown variable X"`) rather than crashing the whole Payrun compute.

## 8. Error Handling

All formula errors are caught in `payrollCompute.service.js` per-rule, per-payslip:
```js
try {
  amount = formulaEngine.evaluate(rule.formulaExpression, context);
} catch (err) {
  amount = 0;
  payslip.warnings.push(`Formula error in rule ${rule.code}: ${err.message}`);
}
```
A single bad formula never blocks computing the rest of the payslip or the rest of the Payrun.

## 9. Security Summary

| Forbidden | Why |
|---|---|
| `eval()` | Arbitrary JS execution |
| `new Function()` | Arbitrary JS execution |
| `child_process` calling a real Python/Node interpreter on user input | Arbitrary code execution, unnecessary complexity |
| Regex-based "sanitize then eval" approaches | Sanitization of a Turing-complete language is not reliably safe; the tokenizer/parser approach sidesteps this entirely by construction |

The formula engine's entire security guarantee comes from the fact that its evaluator is a **closed, finite switch statement** over a small set of AST node types it produces itself — it is architecturally incapable of executing anything outside that set.
