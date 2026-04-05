# Query Plan & Compiler

Every Tyneq sequence carries a live, immutable description of its pipeline. This is the **query plan** - a linked chain of `QueryPlanNode` instances from the outermost operator back to the source.

The query plan is not just for debugging. Combined with `QueryPlanCompiler`, it becomes a way to serialize pipelines as metadata, transform them, optimize them, and replay them on any source. This is the heart of Tyneq's introspection system.

---

## Accessing the plan

```ts
import { Tyneq, tyneqQueryNode } from "tyneq";

const seq = Tyneq.from([1, 2, 3, 4, 5])
  .where(x => x % 2 === 0)
  .select(x => x * 10)
  .take(3);

const node = seq[tyneqQueryNode]; // QueryPlanNode | null
node?.operatorName;               // -> "take"
node?.category;                   // -> "streaming"
node?.source?.operatorName;       // -> "select"
node?.source?.source?.operatorName; // -> "where"
```

`QueryPlanNode` is a singly-linked list. Walk it manually if you want:

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

The node at `seq[tyneqQueryNode]` is the outermost (last-applied) operator. `node.source` walks toward the source. Source nodes (`category === "source"`) are the root and have `source === null`.

---

## Printing

`QueryPlanPrinter` renders the full plan chain as a readable string - from source to the outermost operator.

```ts
import { QueryPlanPrinter, tyneqQueryNode } from "tyneq";

console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
// from([...5 items])
//   -> where(<fn>)
//   -> select(<fn>)
//   -> take(3)
```

Customization options:

```ts
QueryPlanPrinter.print(node, {
  indent: "    ",       // indentation per level (default: "  ")
  arrow: "=>",          // operator separator (default: "->")
  maxInlineArrayItems: 10 // how many array items to show inline
});
```

Subclass to format arguments differently:

```ts
class VerbosePrinter extends QueryPlanPrinter {
  protected override formatArg(arg: unknown): string {
    if (typeof arg === "function") return `<fn:${arg.name || "anonymous"}>`;
    return super.formatArg(arg);
  }
}

new VerbosePrinter().visit(seq[tyneqQueryNode]!);
```

---

## Narrowing source nodes

Source nodes are the root of every plan. They carry a `sourceKind` property describing the original data source. Use `isSourceNode` before reading it - it only exists on source nodes:

```ts
import { isSourceNode } from "tyneq";

let node = seq[tyneqQueryNode];
while (node !== null) {
  if (isSourceNode(node)) {
    console.log("source kind:", node.sourceKind);
    // -> "array" | "set" | "map" | "string" | "other"
  }
  node = node.source;
}
```

---

## Walking the plan

`QueryPlanWalker` traverses the node chain and calls a visitor for each node. Use it for read-only analysis: collecting operator names, counting buffer stages, profiling the pipeline.

### Simple callback

```ts
import { QueryPlanWalker } from "tyneq";

const names: string[] = [];
new QueryPlanWalker({
  callback: node => names.push(node.operatorName),
}).visit(seq[tyneqQueryNode]!);
// names -> ["from", "where", "select", "take"]
```

### Traversal direction

The default is `"source-to-terminal"` (root to outermost). Use `"terminal-to-source"` to go the other way:

```ts
const reversed: string[] = [];
new QueryPlanWalker({
  callback: node => reversed.push(node.operatorName),
  direction: "terminal-to-source",
}).visit(seq[tyneqQueryNode]!);
// reversed -> ["take", "select", "where", "from"]
```

### Stateful walkers via subclassing

Override `visitNode` to accumulate state across the walk:

```ts
class BufferStageCounter extends QueryPlanWalker {
  public count = 0;
  protected override visitNode(node: QueryPlanNode): void {
    if (node.category === "buffer") this.count++;
  }
}

const counter = new BufferStageCounter();
counter.visit(seq[tyneqQueryNode]!);
console.log(`Buffer stages: ${counter.count}`);
// Use this to warn when a pipeline has unexpected O(n) stages
```

```ts
class OperatorNameCollector extends QueryPlanWalker {
  public readonly names: string[] = [];
  public constructor() { super({ direction: "source-to-terminal" }); }
  protected override visitNode(node: QueryPlanNode): void {
    this.names.push(node.operatorName);
  }
}
```

---

## Transforming the plan

`QueryPlanTransformer` walks the chain and rebuilds it, optionally changing node names, arguments, or structure. Transformers produce a new node chain - they never mutate existing nodes (nodes are immutable).

```ts
import { QueryPlanTransformer, QueryNode } from "tyneq";
import type { QueryPlanNode } from "tyneq";

// Rename all 'where' nodes to 'filter' in the view
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

Three structural operations in `transformNode`:

- **Rewrite** - return a new `QueryNode` with different `operatorName` or `args`
- **Remove** - return `source` directly, skipping the current node entirely
- **Collapse** - use `source?.source` to merge two nodes into one

```ts
// Remove all tap nodes from the plan
class StripTap extends QueryPlanTransformer {
  protected override transformNode(node: QueryPlanNode, source: QueryPlanNode | null): QueryPlanNode {
    if (node.operatorName === "tap") return source!; // skip this node
    return super.transformNode(node, source);
  }
}
```

---

## Optimizing the plan

`QueryPlanOptimizer` is a built-in transformer that fuses redundant consecutive operators:

```ts
import { QueryPlanOptimizer } from "tyneq";

const seq = Tyneq.from([1, 2, 3])
  .where(x => x > 0)
  .where(x => x < 3)   // two consecutive where nodes
  .select(x => x * 2)
  .select(x => x + 1); // two consecutive select nodes

const optimized = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
QueryPlanPrinter.print(optimized);
// from([...])
//   -> where(<fn>)   - fused from two where nodes
//   -> select(<fn>)  - fused from two select nodes
```

::: warning
Fusion changes when callbacks fire and how many times. Only use the optimizer on pipelines with **pure, side-effect-free** predicates and projections. If your `where` or `select` has side effects, fusing will change behavior.
:::

---

## The compiler: the heart of the system

`QueryPlanCompiler` is the most powerful part of the query plan tooling. It takes any `QueryPlanNode` and **produces a fully executable `TyneqSequence`** from it.

This is what makes query plans genuinely useful beyond debugging. A plan is pure metadata - a description of what to compute. The compiler turns that description back into something you can actually run.

```ts
import { QueryPlanCompiler } from "tyneq";

const seq = Tyneq.from([1, 2, 3]).where(x => x > 1).select(x => x * 2);
const plan = seq[tyneqQueryNode]!;

const compiler = new QueryPlanCompiler();
const result = compiler.compile(plan);

result.toArray(); // -> [4, 6]  -- same as seq.toArray()
```

### Compiling with transformers

Pass transformers to the compiler. They run over the plan before compilation, in order:

```ts
const compiler = new QueryPlanCompiler([
  new StripTap(),           // remove tap nodes
  new QueryPlanOptimizer(), // fuse redundant operators
]);

const result = compiler.compile(plan);
```

### Skipping transformers

`compileRaw` compiles the plan exactly as-is, without running any transformers:

```ts
compiler.compileRaw(plan).toArray();
```

### Why this is powerful

Because the plan is data, you can:

- **Store pipelines** as JSON metadata (if args are serializable) and reconstruct them later
- **Build reusable pipelines** from configuration without writing code
- **Optimize before execution** - apply `QueryPlanOptimizer` only in production
- **Test pipeline structure** independently from execution
- **Analyze and audit** what operators run before any data flows

```ts
// Build a pipeline from configuration data
function buildReportPipeline(config: ReportConfig) {
  let seq = Tyneq.from(config.source);
  if (config.filter) seq = seq.where(buildPredicate(config.filter));
  if (config.sort) seq = seq.orderBy(buildSelector(config.sort));
  if (config.limit) seq = seq.take(config.limit);

  // Store the plan for later
  const plan = seq[tyneqQueryNode]!;
  reportPlans.set(config.id, plan);
}

// Execute later, with optimization
function runReport(id: string, data: unknown[]) {
  const plan = reportPlans.get(id)!;
  const compiler = new QueryPlanCompiler([new QueryPlanOptimizer()]);
  return compiler.compile(plan).toArray();
}
```

### How the compiler resolves operators

The compiler looks up each operator by name in `OperatorRegistry`. If the operator is registered (either as a built-in or a plugin), the compiler knows how to instantiate it from the plan node's `operatorName` and `args`.

This means **plugin operators are also compilable** as long as they are registered before compilation runs.

---

## Implementing a custom visitor

`QueryPlanVisitor<T>` is a single-method interface. Implement it directly for recursive visitors that accumulate a return value:

```ts
import type { QueryPlanNode, QueryPlanVisitor } from "tyneq";

class OperatorNameCollector implements QueryPlanVisitor<string[]> {
  visit(node: QueryPlanNode): string[] {
    const upstream = node.source ? this.visit(node.source) : [];
    return [...upstream, node.operatorName];
  }
}

const collector = new OperatorNameCollector();
collector.visit(seq[tyneqQueryNode]!);
// -> ["from", "where", "select", "take"]
```

Count buffer stages recursively:

```ts
class BufferStageCounter implements QueryPlanVisitor<number> {
  visit(node: QueryPlanNode): number {
    const upstream = node.source ? this.visit(node.source) : 0;
    return upstream + (node.category === "buffer" ? 1 : 0);
  }
}

const counter = new BufferStageCounter();
const bufferCount = counter.visit(seq[tyneqQueryNode]!);
// Use this in testing to assert pipelines have expected buffer stages
```

Invoke via `node.accept(visitor)`:

```ts
seq[tyneqQueryNode]!.accept(new OperatorNameCollector());
```

---

## Why a single `visit` method?

A static dispatch table (`visitWhere`, `visitSelect`, ...) would need updating every time a new operator is added - including plugin operators registered at runtime. A single `visit(node)` method keeps the visitor interface stable regardless of which operators exist.

This is the canonical Visitor pattern adapted for a dynamic, extensible operator set.

---

## Node immutability

`QueryPlanNode` is fully immutable. Transformers produce new `QueryNode` instances - they never mutate the input. This means you can safely share plan nodes across multiple compilations and transformations.
