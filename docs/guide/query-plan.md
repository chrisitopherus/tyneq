# Query Plan Inspection

Every Tyneq sequence carries an immutable `IQueryNode` chain describing the operators applied to it. It is metadata only - it does not participate in iteration.

## Accessing the Plan

```ts
import { Tyneq, tyneqQueryNode } from "tyneq";

const seq = Tyneq.from([1, 2, 3, 4, 5])
  .where(x => x % 2 === 0)
  .select(x => x * 10)
  .take(3);

const node = seq[tyneqQueryNode];   // IQueryNode | null
node?.operatorName;                  // "take"
node?.category;                      // "streaming"
node?.source?.operatorName;          // "select"
```

`IQueryNode` is a singly-linked list. Walk it to inspect the full chain:

```ts
let current = seq[tyneqQueryNode];
while (current !== null) {
  console.log(current.operatorName, current.category);
  current = current.source;
}
// take     streaming
// select   streaming
// where    streaming
// from     source
```

Sequences created via `.pipe()` opt out - their `[tyneqQueryNode]` is always `null`.

## Printing

```ts
import { Tyneq, tyneqQueryNode, QueryPlanPrinter } from "tyneq";

const seq = Tyneq.from([1, 2, 3, 4, 5])
  .where(x => x % 2 === 0)
  .select(x => x * 10)
  .take(3);

console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
// from([1, 2, 3, ...2 more])
//   -> where(<fn>)
//   -> select(<fn>)
//   -> take(3)
```

Options:

```ts
// Custom indent and arrow
QueryPlanPrinter.print(node, { indent: "  ", arrow: "->" });

// Show more array items inline
QueryPlanPrinter.print(node, { maxInlineArrayItems: 10 });
```

### Subclassing

Override `formatArg` or `formatLine` for custom rendering:

```ts
import { QueryPlanPrinter } from "tyneq";

class VerbosePrinter extends QueryPlanPrinter {
  protected override formatArg(arg: unknown): string {
    if (typeof arg === "function") return `<fn:${arg.name || "anonymous"}>`;
    return super.formatArg(arg);
  }
}

new VerbosePrinter().visit(seq[tyneqQueryNode]!);
```

## Visitor Pattern

`QueryPlanVisitor<T>` walks a plan. Implement `visit(node)` and recurse into `node.source` manually.

```ts
interface QueryPlanVisitor<T> {
  visit(node: IQueryNode): T;
}

// Entry point
const result = seq[tyneqQueryNode]!.accept(new MyVisitor());
```

### Collect operator names

```ts
import type { IQueryNode, QueryPlanVisitor } from "tyneq";

class OperatorCollector implements QueryPlanVisitor<string[]> {
  visit(node: IQueryNode): string[] {
    const upstream = node.source ? this.visit(node.source) : [];
    return [...upstream, node.operatorName];
  }
}

seq[tyneqQueryNode]!.accept(new OperatorCollector());
// ["from", "where", "select", "take"]
```

### Count buffering stages

```ts
class BufferCounter implements QueryPlanVisitor<number> {
  visit(node: IQueryNode): number {
    const upstream = node.source ? this.visit(node.source) : 0;
    return upstream + (node.category === "buffer" ? 1 : 0);
  }
}
```

### Pipeline linter

```ts
class PipelineLinter implements QueryPlanVisitor<string[]> {
  visit(node: IQueryNode): string[] {
    const issues = node.source ? this.visit(node.source) : [];
    if (
      (node.operatorName === "orderBy" || node.operatorName === "orderByDescending") &&
      node.source?.operatorName === "take"
    ) {
      issues.push(`${node.operatorName} placed after take - did you mean to sort before limiting?`);
    }
    return issues;
  }
}
```

### JSON serialization

```ts
interface NodeJson { op: string; category: string; argTypes: string[]; source: NodeJson | null; }

class JsonSerializer implements QueryPlanVisitor<NodeJson> {
  visit(node: IQueryNode): NodeJson {
    return {
      op: node.operatorName,
      category: node.category,
      argTypes: node.args.map(a => typeof a),
      source: node.source ? this.visit(node.source) : null,
    };
  }
}

JSON.stringify(seq[tyneqQueryNode]!.accept(new JsonSerializer()), null, 2);
```

## Notes

**Single `visit` method** - operators are registered dynamically at runtime, so a static dispatch table (`visitWhere`, `visitSelect`, …) would need to be updated on every new operator. A single `visit` method delegates dispatch inside the visitor body, keeping the interface stable regardless of which operators are registered.

**Node immutability** - `IQueryNode` is fully immutable. Visitors that transform plans construct new `QueryNode` instances - they cannot mutate existing nodes.
