# Query Plan

Every Tyneq sequence carries an immutable `QueryPlanNode` chain describing the operators applied to it. It is metadata only - it does not participate in iteration.

## Accessing the Plan

```ts
import { Tyneq, tyneqQueryNode } from "tyneq";

const seq = Tyneq.from([1, 2, 3, 4, 5])
  .where(x => x % 2 === 0)
  .select(x => x * 10)
  .take(3);

const node = seq[tyneqQueryNode];   // QueryPlanNode | null
node?.operatorName;                  // -> "take"
node?.category;                      // -> "streaming"
node?.source?.operatorName;          // -> "select"
```

`QueryPlanNode` is a singly-linked list. Walk it manually to inspect the full chain:

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

Sequences created via `.pipe()` record a `"pipe"` node - their `[tyneqQueryNode]` is never `null`.

## Printing

`QueryPlanPrinter` renders the plan as a human-readable string.

```ts
import { Tyneq, tyneqQueryNode, QueryPlanPrinter } from "tyneq";

const seq = Tyneq.from([1, 2, 3, 4, 5])
  .where(x => x % 2 === 0)
  .select(x => x * 10)
  .take(3);

console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
// from([...5 items])
//   -> where(<fn>)
//   -> select(<fn>)
//   -> take(3)
```

Options:

```ts
QueryPlanPrinter.print(node, { indent: "    ", arrow: "=>", maxInlineArrayItems: 10 });
```

Subclass to customize argument formatting:

```ts
class VerbosePrinter extends QueryPlanPrinter {
  protected override formatArg(arg: unknown): string {
    if (typeof arg === "function") return `<fn:${arg.name || "anonymous"}>`;
    return super.formatArg(arg);
  }
}

new VerbosePrinter().visit(seq[tyneqQueryNode]!);
```

## Narrowing Source Nodes

Source nodes (`category === "source"`) are the only nodes that carry `sourceKind`. Use the `isSourceNode` guard before reading it:

```ts
import { isSourceNode } from "tyneq";

let node = seq[tyneqQueryNode];
while (node !== null) {
  if (isSourceNode(node)) {
    console.log(node.sourceKind); // -> "array" | "set" | "map" | "string" | "other"
  }
  node = node.source;
}
```

## Walking the Plan

`QueryPlanWalker` traverses the node chain and calls a visitor function (or overrideable method) for each node.

### Direct instantiation with a callback

The simplest usage - no subclass needed:

```ts
import { Tyneq, tyneqQueryNode, QueryPlanWalker } from "tyneq";

const names: string[] = [];
new QueryPlanWalker({
  callback: node => names.push(node.operatorName),
}).visit(seq[tyneqQueryNode]!);
// names -> ["from", "where", "select", "take"]
```

### Traversal direction

`"source-to-terminal"` (default): visits from the source node up to the terminal.
`"terminal-to-source"`: visits from the terminal node down to the source.

```ts
const reversed: string[] = [];
new QueryPlanWalker({
  callback: node => reversed.push(node.operatorName),
  direction: "terminal-to-source",
}).visit(seq[tyneqQueryNode]!);
// reversed -> ["take", "select", "where", "from"]
```

### Subclassing for stateful walkers

Override `visitNode` when you need to accumulate state across nodes:

```ts
class BufferCounter extends QueryPlanWalker {
  public count = 0;
  protected override visitNode(node: QueryPlanNode): void {
    if (node.category === "buffer") this.count++;
  }
}

const counter = new BufferCounter();
counter.visit(seq[tyneqQueryNode]!);
console.log(counter.count); // -> 0 (no buffering operators in this plan)
```

Pass options to `super` to configure direction:

```ts
class ReverseCollector extends QueryPlanWalker {
  public readonly names: string[] = [];
  public constructor() { super({ direction: "terminal-to-source" }); }
  protected override visitNode(node: QueryPlanNode): void {
    this.names.push(node.operatorName);
  }
}
```

## Transforming the Plan

`QueryPlanTransformer` rebuilds the node chain, allowing structural changes.

```ts
import { QueryPlanTransformer, QueryNode } from "tyneq";
import type { QueryPlanNode } from "tyneq";

// Rename all 'where' nodes to 'filter' in the plan view
class RenameWhere extends QueryPlanTransformer {
  protected override transformNode(node: QueryPlanNode, source: QueryPlanNode | null): QueryPlanNode {
    if (node.operatorName === "where") {
      return new QueryNode("filter", node.args, source, node.category);
    }
    return super.transformNode(node, source);
  }
}

const rewritten = new RenameWhere().visit(seq[tyneqQueryNode]!);
QueryPlanPrinter.print(rewritten);
// from([...])
//   -> filter(<fn>)
//   -> select(<fn>)
//   -> take(3)
```

Three rewrite patterns are available in `transformNode`:

- **Rewrite** - return a new `QueryNode` with different `operatorName` or `args`
- **Remove** - return `source` directly, skipping the current node
- **Collapse** - use `source.source` to fuse two nodes into one

## Optimizing the Plan

`QueryPlanOptimizer` is a built-in transformer that fuses redundant consecutive operators.

```ts
import { QueryPlanOptimizer } from "tyneq";

const seq = Tyneq.from([1, 2, 3])
  .where(x => x > 0)
  .where(x => x < 3)
  .select(x => x * 2)
  .select(x => x + 1);

const optimized = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
QueryPlanPrinter.print(optimized);
// from([...])
//   -> where(<fn>)   - two where nodes fused into one
//   -> select(<fn>)  - two select nodes fused into one
```

**Caution:** fusion changes when and how many times callbacks fire. Only use the optimizer on pipelines with pure, side-effect-free predicates and projections.

## Compiling the Plan

`QueryPlanCompiler` turns a `QueryPlanNode` chain back into an executable `TyneqSequence`. Useful for serializing and replaying pipelines.

```ts
import { QueryPlanCompiler, QueryPlanOptimizer } from "tyneq";

const seq = Tyneq.from([1, 2, 3]).where(x => x > 1).select(x => x * 2);

const compiler = new QueryPlanCompiler([new QueryPlanOptimizer()]);
const result = compiler.compile(seq[tyneqQueryNode]!);

result.toArray(); // -> [4, 6]
```

`compileRaw` skips the transformer phase:

```ts
compiler.compileRaw(seq[tyneqQueryNode]!).toArray();
```

The compiler looks up each operator by name in `OperatorRegistry`. Only registered operators (including all built-ins and any registered plugins) can be compiled.

## Implementing a Custom Visitor

`QueryPlanVisitor<T>` is a single-method interface. Implement it directly for non-walker use cases:

```ts
import type { QueryPlanNode, QueryPlanVisitor } from "tyneq";

class OperatorCollector implements QueryPlanVisitor<string[]> {
  visit(node: QueryPlanNode): string[] {
    const upstream = node.source ? this.visit(node.source) : [];
    return [...upstream, node.operatorName];
  }
}

seq[tyneqQueryNode]!.accept(new OperatorCollector());
// -> ["from", "where", "select", "take"]
```

Count buffering stages:

```ts
class BufferStageCounter implements QueryPlanVisitor<number> {
  visit(node: QueryPlanNode): number {
    const upstream = node.source ? this.visit(node.source) : 0;
    return upstream + (node.category === "buffer" ? 1 : 0);
  }
}
```

## Notes

**Single `visit` method** - operators are registered dynamically at runtime, so a static dispatch table (`visitWhere`, `visitSelect`, ...) would need updating on every new operator. A single `visit` method keeps the interface stable regardless of which operators are registered.

**Node immutability** - `QueryPlanNode` is fully immutable. Transformers construct new `QueryNode` instances - they cannot mutate existing nodes.
