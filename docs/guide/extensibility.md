# Extensibility and Query Plans

This page explains how to extend Tyneq with custom operators, how to use the `OperatorRegistry` for introspection, and how to apply the visitor pattern to query plans for analysis, optimization, and tooling.

## Extending Tyneq with Operators

Tyneq exposes a public registration API that lets you add operators without modifying the library source. All registration paths live in `tyneq/extensibility`.

### The Three Functional APIs

Choose the API that matches the complexity of your operator:

| API | Output | Use when |
|---|---|---|
| `createGeneratorOperator` | `ITyneqEnumerable<T>` | Streaming operator expressible as a generator function |
| `createOperator` | `ITyneqEnumerable<T>` | Streaming/buffering operator with a custom enumerator factory |
| `createTerminalOperator` | A concrete value | Terminal operator — returns a scalar or collection |

All three register the operator as a method on every `TyneqEnumerable` instance immediately on import.

### Streaming Operator — Generator Style

```ts
import { createGeneratorOperator } from 'tyneq/extensibility';

createGeneratorOperator({
    name: 'repeat',
    *generator(source: Iterable<unknown>, times: number): IterableIterator<unknown> {
        for (let i = 0; i < times; i++) {
            yield* source;
        }
    },
    validate(times) {
        if (typeof times !== 'number' || times < 0) {
            throw new RangeError('repeat: times must be a non-negative integer');
        }
    }
});

// Type augmentation so TypeScript knows about the new method
declare module 'tyneq' {
    interface ITyneqEnumerable<TSource> {
        repeat(times: number): ITyneqEnumerable<TSource>;
    }
}
```

Registration happens as a **side-effect of importing** the file. The operator is available on all sequences immediately after import; no further setup is needed.

### Streaming Operator — Factory Style

Use `createOperator` when you need more control over the enumerator — for example, to maintain state between elements or to access the source as an `IEnumerable` rather than an `Iterable`.

```ts
import { createOperator } from 'tyneq/extensibility';
import type { IEnumerable, IEnumeratorFactory } from 'tyneq';

createOperator({
    name: 'stride',
    factory(source: IEnumerable<unknown>, step: number): IEnumeratorFactory<unknown> {
        return {
            getEnumerator() {
                return strideGenerator(source[Symbol.iterator](), step) as any;
            }
        };
    },
    validate(step) {
        if (typeof step !== 'number' || step < 1) {
            throw new RangeError('stride: step must be >= 1');
        }
    }
});

function* strideGenerator<T>(iter: Iterator<T>, step: number): IterableIterator<T> {
    let index = 0;
    let result = iter.next();
    while (!result.done) {
        if (index % step === 0) yield result.value;
        result = iter.next();
        index++;
    }
}

declare module 'tyneq' {
    interface ITyneqEnumerable<TSource> {
        stride(step: number): ITyneqEnumerable<TSource>;
    }
}
```

### Terminal Operator

```ts
import { createTerminalOperator } from 'tyneq/extensibility';
import type { IEnumerable } from 'tyneq';

createTerminalOperator({
    name: 'joinString',
    execute(source: IEnumerable<unknown>, separator: string): string {
        const parts: string[] = [];
        for (const item of source) parts.push(String(item));
        return parts.join(separator);
    }
});

declare module 'tyneq' {
    interface ITyneqEnumerable<TSource> {
        joinString(separator: string): string;
    }
}
```

```ts
Tyneq.from([1, 2, 3]).joinString(', ');
// → "1, 2, 3"
```

### Validation Contract

`validate` (or the decorator's second argument) runs **eagerly at the call site**, before any deferred factory is created. This means argument errors are thrown immediately when the user calls the method — not during iteration.

Keep validation runtime-defensive: use `unknown` parameter types in `validate` and narrow explicitly inside the body. TypeScript infers the types from the `factory`/`generator`/`execute` function signature, giving a fully-typed `validate` body with no extra annotations needed.

---

## The OperatorRegistry

`OperatorRegistry` is the central registry for all registered operators. Every registration path routes through it.

### Introspection

```ts
import { OperatorRegistry } from 'tyneq/extensibility';

// List all registered operators
OperatorRegistry.list();
// → [{ name: 'where', kind: 'streaming', source: 'internal' }, ...]

// Filter by kind
OperatorRegistry.listByKind('terminal');

// Check if an operator exists
OperatorRegistry.has('myCustomOp');

// Get metadata for a specific operator
const meta = OperatorRegistry.get('select');
// → { name: 'select', kind: 'streaming', source: 'internal' }

// Total count
OperatorRegistry.count();
```

### Registration Guards

A guard runs synchronously before every registration and may throw to block it. Use guards to enforce naming conventions or prevent conflicts in a plugin system.

```ts
import { OperatorRegistry } from 'tyneq/extensibility';

// Enforce a naming prefix for all third-party operators
OperatorRegistry.addGuard(entry => {
    if (entry.metadata.source === 'external' && !entry.metadata.name.startsWith('mylib_')) {
        throw new Error(`External operators must be prefixed with 'mylib_'`);
    }
});
```

### Post-Registration Hooks

Hooks fire after each successful registration. They are observation-only — they cannot block registration.

```ts
import { OperatorRegistry } from 'tyneq/extensibility';

const unsubscribe = OperatorRegistry.onRegister(entry => {
    console.log(`Operator registered: ${entry.metadata.name} (${entry.metadata.kind})`);
});

// Later — detach the hook
unsubscribe();
```

### Test Isolation

`OperatorRegistry.unregister` removes an operator from the registry and from `TyneqEnumerableBase.prototype`. Use it in `afterEach` to avoid polluting the prototype across tests:

```ts
import { OperatorRegistry, createGeneratorOperator } from 'tyneq/extensibility';
import { afterEach, it } from 'vitest';

let registeredName: string | null = null;

afterEach(() => {
    if (registeredName) {
        OperatorRegistry.unregister(registeredName);
        registeredName = null;
    }
});

it('custom operator', () => {
    registeredName = 'testOp_' + Date.now();
    createGeneratorOperator({ name: registeredName, *generator(source) { yield* source as any; } });
    // ...
});
```

### Attaching Custom Metadata

`OperatorMetadata` has an open index signature — you can attach arbitrary properties to any registered operator. Access them via `OperatorRegistry.get`.

```ts
createOperator({
    name: 'myOp',
    factory(source) { /* ... */ },
    // Extra metadata on the registered entry:
    kind: 'streaming',
    mylib_version: '1.0.0',         // attached as metadata.mylib_version
    mylib_stable: true
} as any);

const meta = OperatorRegistry.get('myOp');
console.log(meta?.mylib_version); // "1.0.0"
```

---

## Query Plans

Every sequence produced by a Tyneq operator carries an immutable `IQueryNode` that describes the operator and its arguments. Nodes are linked into a singly-linked list from the terminal node back to the root source node.

### Accessing the Query Plan

```ts
import { Tyneq, tyneqQueryNode } from 'tyneq';

const seq = Tyneq
    .from([1, 2, 3, 4, 5])
    .where(x => x % 2 === 0)
    .select(x => x * 10)
    .take(3);

const node = seq[tyneqQueryNode];   // IQueryNode | null
console.log(node?.operatorName);    // 'take'
console.log(node?.source?.operatorName); // 'select'
```

`null` is returned for sequences created via `.pipe()`, which bypasses the query-plan infrastructure.

### Printing the Plan

`QueryPlanPrinter` converts a node chain to a human-readable string:

```ts
import { QueryPlanPrinter, tyneqQueryNode } from 'tyneq';

const plan = QueryPlanPrinter.print(seq[tyneqQueryNode]!);
console.log(plan);
// from([...5 items])
//   → where(<fn>)
//   → select(<fn>)
//   → take(3)
```

Output can be redirected to `'none'` (suppress console output) or to a file path:

```ts
// Just capture the string without printing
const str = QueryPlanPrinter.print(node, { output: 'none' });

// Write to a file
QueryPlanPrinter.print(node, { output: './debug/plan.txt' });
```

Customize argument rendering by subclassing:

```ts
class VerbosePrinter extends QueryPlanPrinter {
    protected override formatArg(arg: unknown): string {
        if (typeof arg === 'function') return `<fn:${arg.name || 'anonymous'}>`;
        return super.formatArg(arg);
    }

    // Optional: include operator category in the line
    protected override formatLine(name: string, argStr: string, isRoot: boolean): string {
        const base = super.formatLine(name, argStr, isRoot);
        return base; // add category via node if needed
    }
}
```

---

## The Visitor Pattern

`IQueryPlanVisitor<T>` is the interface for walking a query plan. Implement `visit(node)` to dispatch logic based on `node.operatorName`, `node.category`, or `node.args`. The visitor is responsible for recursing into `node.source`.

```ts
interface IQueryPlanVisitor<T> {
    visit(node: IQueryNode): T;
}
```

### Pattern: Collecting Queries

Count all operators or collect all operator names in a pipeline:

```ts
import type { IQueryNode, IQueryPlanVisitor } from 'tyneq';

class OperatorCollector implements IQueryPlanVisitor<string[]> {
    visit(node: IQueryNode): string[] {
        const upstream = node.source ? this.visit(node.source) : [];
        return [...upstream, node.operatorName];
    }
}

const names = seq[tyneqQueryNode]!.accept(new OperatorCollector());
// → ['from', 'where', 'select', 'take']
```

### Pattern: Budget Checker

Warn when a pipeline contains more than one buffering stage:

```ts
import type { IQueryNode, IQueryPlanVisitor } from 'tyneq';

class BufferBudgetChecker implements IQueryPlanVisitor<string[]> {
    visit(node: IQueryNode): string[] {
        const upstream = node.source ? this.visit(node.source) : [];
        if (node.category === 'buffer') return [...upstream, node.operatorName];
        return upstream;
    }
}

const bufferStages = seq[tyneqQueryNode]!.accept(new BufferBudgetChecker());
if (bufferStages.length > 1) {
    console.warn(`Pipeline has ${bufferStages.length} buffering stages: ${bufferStages.join(', ')}`);
}
```

### Pattern: Query Optimizer

Return a new `IQueryNode` from the visitor to produce a rewritten, optimized plan. Combine adjacent `where` predicates into a single node to reduce pass count:

```ts
import { QueryNode } from 'tyneq';
import type { IQueryNode, IQueryPlanVisitor } from 'tyneq';

class PredicateFuser implements IQueryPlanVisitor<IQueryNode> {
    visit(node: IQueryNode): IQueryNode {
        // Recursively optimize the upstream chain first
        const optimizedSource = node.source ? this.visit(node.source) : null;

        // Fuse adjacent where().where() into a single where()
        if (
            node.operatorName === 'where' &&
            optimizedSource?.operatorName === 'where'
        ) {
            const [outer] = node.args as [(x: unknown) => boolean];
            const [inner] = optimizedSource.args as [(x: unknown) => boolean];
            // Combined predicate: must pass both tests
            const fused = (x: unknown) => inner(x) && outer(x);
            return new QueryNode('where', [fused], optimizedSource.source, 'streaming');
        }

        // Default: rebuild with the optimized source
        return new QueryNode(
            node.operatorName,
            node.args,
            optimizedSource,
            node.category
        );
    }
}
```

> **Note:** The optimizer rewrites the query **plan** (metadata). It does not re-execute the pipeline or alter existing enumerable objects. To apply an optimized plan to a live pipeline you would need to feed the rewritten plan back into a new operator chain.

### Pattern: Serializer / Deserializer

Serialize a query plan to JSON for logging, profiling, or remote debugging:

```ts
import type { IQueryNode, IQueryPlanVisitor } from 'tyneq';

interface NodeJson {
    op: string;
    category: string;
    argTypes: string[];
    source: NodeJson | null;
}

class JsonSerializer implements IQueryPlanVisitor<NodeJson> {
    visit(node: IQueryNode): NodeJson {
        return {
            op: node.operatorName,
            category: node.category,
            argTypes: node.args.map(a => typeof a),
            source: node.source ? this.visit(node.source) : null,
        };
    }
}

const json = JSON.stringify(
    seq[tyneqQueryNode]!.accept(new JsonSerializer()),
    null, 2
);
```

### Pattern: Linter

Flag common pipeline anti-patterns — for instance, an `orderBy` placed after a `take`:

```ts
import type { IQueryNode, IQueryPlanVisitor } from 'tyneq';

class PipelineLinter implements IQueryPlanVisitor<string[]> {
    visit(node: IQueryNode): string[] {
        const issues = node.source ? this.visit(node.source) : [];

        if (node.operatorName === 'orderBy' || node.operatorName === 'orderByDescending') {
            // Check if source is a take/skip — sorting after limiting is usually a bug
            if (node.source?.operatorName === 'take') {
                issues.push('orderBy placed after take — did you mean to sort before limiting?');
            }
        }

        return issues;
    }
}

const warnings = seq[tyneqQueryNode]!.accept(new PipelineLinter());
warnings.forEach(w => console.warn(w));
```

---

## Design Notes

### Why a Single `visit` Method?

Operators are registered dynamically at runtime. A static dispatch table (`visitWhere`, `visitSelect`, …) would need to be updated every time a new operator is added or an external operator is registered. The single-method `IQueryPlanVisitor<T>` delegates operator-specific dispatch to `node.operatorName` inside the visitor body, keeping the interface stable regardless of which operators are registered.

### Node Immutability

`IQueryNode` is fully immutable. Visitors that transform query plans must construct new `QueryNode` instances (as in the optimizer example above) — they cannot mutate existing nodes. This guarantees that multiple visitors operating over the same chain don't interfere with each other.

### Query Plan Coverage

The query plan is built automatically by all registration paths: `@operator`, `@terminal`, `createOperator`, `createGeneratorOperator`, and `createTerminalOperator`. Every operator registered through these paths contributes a node to the chain.

Operators implemented directly on `TyneqEnumerableBase` (such as `orderBy`, `memoize`) create their `QueryNode` manually and thread it into the factory call — so they also appear in the plan.

Sequences created via `.pipe()` opt out of the query-plan infrastructure. Their `[tyneqQueryNode]` value is `null`.

---

## Related Pages

- [Contributing](/guide/contributing)
- [Core Concepts](/guide/concepts)
- [API Reference — QueryPlan](/api/reference/)
