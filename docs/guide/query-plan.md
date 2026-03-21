# Query Plan Inspection

Every sequence produced by a Tyneq operator carries an immutable **query plan** — a linked list of `IQueryNode` objects describing the operators that built it. This page explains how to access, print, and traverse that plan.

## What This Page Covers

| Section | What you will learn |
|---|---|
| [Accessing the Plan](#accessing-the-plan) | The `tyneqQueryNode` symbol and `IQueryNode` structure |
| [Printing](#printing) | `QueryPlanPrinter` — formatted multi-line string output |
| [The Visitor Pattern](#the-visitor-pattern) | Walk plans to collect, analyze, lint, or serialize |
| [Design Notes](#design-notes) | Why a single `visit` method; node immutability |

---

## Accessing the Plan

Use the `tyneqQueryNode` symbol to read the plan from any sequence:

```ts
import { Tyneq, tyneqQueryNode } from "tyneq";

const seq = Tyneq
    .from([1, 2, 3, 4, 5])
    .where(x => x % 2 === 0)
    .select(x => x * 10)
    .take(3);

const node = seq[tyneqQueryNode];   // IQueryNode | null
console.log(node?.operatorName);    // "take"
console.log(node?.category);        // "streaming"
console.log(node?.source?.operatorName); // "select"
```

`IQueryNode` is a singly-linked list ending at the root source node where `source === null`. Walk it to inspect the full chain:

```ts
let current = node;
while (current !== null) {
    console.log(current.operatorName, current.category);
    current = current.source;
}
// take        streaming
// select      streaming
// where       streaming
// from        source
```

`[tyneqQueryNode]` returns `null` for sequences created via `.pipe()`, which opts out of the query-plan infrastructure.

---

## Printing

`QueryPlanPrinter` converts a node chain into a human-readable multi-line string.

```ts
import { Tyneq, tyneqQueryNode, QueryPlanPrinter } from "tyneq";

const seq = Tyneq.from([1, 2, 3, 4, 5])
    .where(x => x % 2 === 0)
    .select(x => x * 10)
    .take(3);

const plan = QueryPlanPrinter.print(seq[tyneqQueryNode]!);
console.log(plan);
// from([1, 2, 3, ...2 more])
//   → where(<fn>)
//   → select(<fn>)
//   → take(3)
```

### Customizing Output

Pass options to `print()` or to the constructor:

```ts
// Custom indent and arrow
const compact = QueryPlanPrinter.print(node, {
    indent: "  ",
    arrow: "->",
});

// Increase inline array display limit (default: 3)
const verbose = QueryPlanPrinter.print(node, {
    maxInlineArrayItems: 10,
});
```

### Subclassing the Printer

Override `formatArg` or `formatLine` for custom rendering:

```ts
import { QueryPlanPrinter } from "tyneq";
import type { IQueryNode } from "tyneq";

class VerbosePrinter extends QueryPlanPrinter {
    // Show function names instead of generic <fn>
    protected override formatArg(arg: unknown): string {
        if (typeof arg === "function") {
            return `<fn:${arg.name || "anonymous"}>`;
        }
        return super.formatArg(arg);
    }

    // Prefix each line with the operator category
    protected override formatLine(name: string, argStr: string, isRoot: boolean): string {
        return super.formatLine(name, argStr, isRoot);
    }
}

const plan = new VerbosePrinter().visit(seq[tyneqQueryNode]!);
```

---

## The Visitor Pattern

`IQueryPlanVisitor<T>` is the interface for walking a query plan. Implement `visit(node)` to dispatch logic based on `node.operatorName`, `node.category`, or `node.args`. The visitor is responsible for recursing into `node.source`.

```ts
interface IQueryPlanVisitor<T> {
    visit(node: IQueryNode): T;
}
```

Use `node.accept(visitor)` as the entry point — it calls `visitor.visit(node)`:

```ts
const result = seq[tyneqQueryNode]!.accept(new MyVisitor());
```

### Pattern: Collecting Operator Names

```ts
import type { IQueryNode, IQueryPlanVisitor } from "tyneq";

class OperatorCollector implements IQueryPlanVisitor<string[]> {
    public visit(node: IQueryNode): string[] {
        const upstream = node.source ? this.visit(node.source) : [];
        return [...upstream, node.operatorName];
    }
}

const names = seq[tyneqQueryNode]!.accept(new OperatorCollector());
// → ["from", "where", "select", "take"]
```

### Pattern: Buffer Stage Counter

Warn when a pipeline contains more than one buffering stage:

```ts
import type { IQueryNode, IQueryPlanVisitor } from "tyneq";

class BufferBudgetChecker implements IQueryPlanVisitor<string[]> {
    public visit(node: IQueryNode): string[] {
        const upstream = node.source ? this.visit(node.source) : [];
        if (node.category === "buffer") return [...upstream, node.operatorName];
        return upstream;
    }
}

const bufferStages = seq[tyneqQueryNode]!.accept(new BufferBudgetChecker());
if (bufferStages.length > 1) {
    console.warn(`Pipeline has ${bufferStages.length} buffering stages: ${bufferStages.join(", ")}`);
}
```

### Pattern: Pipeline Linter

Flag common anti-patterns — for example, an `orderBy` placed after a `take`:

```ts
import type { IQueryNode, IQueryPlanVisitor } from "tyneq";

class PipelineLinter implements IQueryPlanVisitor<string[]> {
    public visit(node: IQueryNode): string[] {
        const issues = node.source ? this.visit(node.source) : [];

        if (
            (node.operatorName === "orderBy" || node.operatorName === "orderByDescending") &&
            node.source?.operatorName === "take"
        ) {
            issues.push(`${node.operatorName} placed after take — did you mean to sort before limiting?`);
        }

        return issues;
    }
}

const warnings = seq[tyneqQueryNode]!.accept(new PipelineLinter());
warnings.forEach(w => console.warn(w));
```

### Pattern: JSON Serializer

Serialize a plan to JSON for logging, profiling, or remote debugging:

```ts
import type { IQueryNode, IQueryPlanVisitor } from "tyneq";

interface NodeJson {
    op: string;
    category: string;
    argTypes: string[];
    source: NodeJson | null;
}

class JsonSerializer implements IQueryPlanVisitor<NodeJson> {
    public visit(node: IQueryNode): NodeJson {
        return {
            op: node.operatorName,
            category: node.category,
            argTypes: node.args.map(a => typeof a),
            source: node.source ? this.visit(node.source) : null,
        };
    }
}

const json = JSON.stringify(seq[tyneqQueryNode]!.accept(new JsonSerializer()), null, 2);
```

### Pattern: Query Optimizer

Return a new `IQueryNode` to produce a rewritten plan. The example below fuses adjacent `where()` calls into a single predicate:

```ts
import { QueryNode } from "tyneq";
import type { IQueryNode, IQueryPlanVisitor } from "tyneq";

class PredicateFuser implements IQueryPlanVisitor<IQueryNode> {
    public visit(node: IQueryNode): IQueryNode {
        const optimizedSource = node.source ? this.visit(node.source) : null;

        // Fuse adjacent where().where() into a single where()
        if (
            node.operatorName === "where" &&
            optimizedSource?.operatorName === "where"
        ) {
            const [outer] = node.args as [(x: unknown) => boolean];
            const [inner] = optimizedSource.args as [(x: unknown) => boolean];
            const fused = (x: unknown) => inner(x) && outer(x);
            return new QueryNode("where", [fused], optimizedSource.source, "streaming");
        }

        return new QueryNode(node.operatorName, node.args, optimizedSource, node.category);
    }
}
```

> **Note:** The optimizer rewrites the plan (metadata). It does not re-execute the pipeline or alter existing enumerable objects. To apply an optimized plan, you would need to reconstruct the operator chain from the rewritten nodes.

---

## Design Notes

### Why a Single `visit` Method?

Operators are registered dynamically at runtime. A static dispatch table (`visitWhere`, `visitSelect`, …) would need to be updated every time a new operator is added or an external operator is registered. The single-method `IQueryPlanVisitor<T>` delegates dispatch to `node.operatorName` inside the visitor body, keeping the interface stable regardless of which operators are registered.

### Node Immutability

`IQueryNode` is fully immutable. Visitors that transform plans must construct new `QueryNode` instances — they cannot mutate existing nodes. This guarantees that multiple visitors operating over the same chain don't interfere with each other.

### Coverage

The query plan is built automatically by all registration paths: `@operator`, `@terminal`, `createOperator`, `createGeneratorOperator`, and `createTerminalOperator`. Operators implemented directly on `TyneqEnumerableBase` (such as `orderBy`, `memoize`) create their `QueryNode` manually.

Sequences created via `.pipe()` opt out of the query-plan infrastructure. Their `[tyneqQueryNode]` is always `null`.

---

## Related Pages

- [Custom Operators](/guide/extensibility)
- [Core Concepts](/guide/concepts)
- [API Reference](/api/reference/)
