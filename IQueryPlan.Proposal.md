The Problem First
Right now, when you write:


seq.where(x => x > 0).select(x => x * 2).where(x => x < 100).take(5)
What actually exists in memory is a chain of nested factories. Each createEnumerable({ getEnumerator() { ... } }) wraps the previous one. The chain is opaque — you can iterate it, but you cannot look inside it. There's no object representing "this is a where after a select". The structure is lost the moment the lambda closes over source.getEnumerator().

That means:

You can't print the chain for debugging
You can't detect where().where() and merge them into where(a && b)
You can't warn users that orderBy buried inside a chain forces O(n) memory
You can't serialize or analyze a query before running it
The Visitor Pattern — Abstract Level
Visitor solves a specific OOP tension: you have a stable data structure, and you want to add new operations over it without modifying the structure.

Two axes of variation:

Nodes (the data structure) — e.g., WhereNode, SelectNode, TakeNode
Operations (what you do with them) — e.g., print, optimize, cost-estimate
Without Visitor, adding a new operation means adding a method to every node class. With Visitor, you write one new class per operation. The nodes stay closed.


                     Visitor interface
                    ┌───────────────────────────────────┐
                    │  visit(node: IQueryNode): T        │
                    └───────────────────────────────────┘
                              ▲           ▲           ▲
                    QueryPlanPrinter  Optimizer  CostEstimator
                    (new operation)  (new op)   (new op)

Node hierarchy:
  IQueryNode ← SourceNode / StreamingNode / BufferingNode / TerminalNode
  (stable — rarely changes)
The node's only job: accept(visitor) → calls visitor.visit(this). The visitor does the actual work.

How It Fits Into Tyneq's Architecture
The key is that each TyneqEnumerable would carry a QueryNode — a lightweight, immutable description of how it was built. Execution stays unchanged. The node is just metadata.

Step 1: The Node

// src/queryplan/QueryNode.ts

export type OperatorCategory = 'source' | 'streaming' | 'buffering' | 'terminal';

export interface IQueryNode {
    readonly operatorName: string;
    readonly args: readonly unknown[];          // the user args (for inspection)
    readonly source: IQueryNode | null;         // null = root (Tyneq.from, Tyneq.range)
    readonly category: OperatorCategory;
    accept<T>(visitor: QueryPlanVisitor<T>): T;
}

export class QueryNode implements IQueryNode {
    constructor(
        public readonly operatorName: string,
        public readonly args: readonly unknown[],
        public readonly source: IQueryNode | null,
        public readonly category: OperatorCategory
    ) {}

    accept<T>(visitor: QueryPlanVisitor<T>): T {
        return visitor.visit(this);
    }
}
Step 2: The Visitor Interface

// src/queryplan/QueryPlanVisitor.ts

export interface QueryPlanVisitor<T> {
    visit(node: IQueryNode): T;
}
That's it. One method. The node passes itself in — the visitor decides what to do based on node.operatorName and node.category.

Step 3: Hook Into the Decorator
In operatorDecorators.ts the @operator decorator currently does:


proto[name] = function (this: TyneqEnumerableBase<any>, ...userArgs: any[]) {
    validate?.(...userArgs);
    const source = this;
    return this.createEnumerable({
        getEnumerator() {
            return new target(source.getEnumerator(), ...userArgs);
        }
    });
};
With query plan support, it becomes:


proto[name] = function (this: TyneqEnumerable<any>, ...userArgs: any[]) {
    validate?.(...userArgs);
    const source = this;
    const node = new QueryNode(name, userArgs, this.queryNode, category); // ← new
    return this.createEnumerable({
        getEnumerator() {
            return new target(source.getEnumerator(), ...userArgs);
        }
    }, node); // ← pass node along
};
TyneqEnumerable gets a queryNode property. createEnumerable threads it through. No enumerator class changes.

The Visitors You Can Now Write
1. Query Plan Printer (debugging)

class QueryPlanPrinter implements QueryPlanVisitor<string> {
    visit(node: IQueryNode): string {
        const argStr = node.args
            .map(a => typeof a === 'function' ? '<fn>' : String(a))
            .join(', ');
        const self = `${node.operatorName}(${argStr})`;
        return node.source
            ? this.visit(node.source) + '\n  → ' + self
            : self;
    }
}

// Usage:
const chain = Tyneq.from([1,2,3]).where(x => x > 0).select(x => x * 2).take(5);
console.log(new QueryPlanPrinter().visit(chain.queryNode));

// Output:
// from(<iterable>)
//   → where(<fn>)
//   → select(<fn>)
//   → take(5)
2. Redundancy Detector

class RedundancyDetector implements QueryPlanVisitor<string[]> {
    visit(node: IQueryNode): string[] {
        const issues = node.source ? this.visit(node.source) : [];

        if (node.operatorName === 'where' && node.source?.operatorName === 'where') {
            issues.push(`Redundant where().where() — can merge predicates with &&`);
        }

        if (node.operatorName === 'select' && node.source?.operatorName === 'select') {
            issues.push(`Redundant select().select() — can compose selectors`);
        }

        return issues;
    }
}
3. Memory Cost Estimator

const BUFFERING_OPS = new Set(['orderBy', 'thenBy', 'distinct', 'groupBy', 'reverse', 'chunk']);

class MemoryCostEstimator implements QueryPlanVisitor<'O(1)' | 'O(n)'> {
    visit(node: IQueryNode): 'O(1)' | 'O(n)' {
        if (BUFFERING_OPS.has(node.operatorName)) return 'O(n)';
        return node.source ? this.visit(node.source) : 'O(1)';
    }
}

// Warn users at build time or test time:
const cost = new MemoryCostEstimator().visit(chain.queryNode);
// → 'O(n)' if there's an orderBy anywhere in the chain
4. Query Optimizer (the where().where() merge)

class QueryOptimizer implements QueryPlanVisitor<IQueryNode> {
    visit(node: IQueryNode): IQueryNode {
        // First, recursively optimize the source
        const optimizedSource = node.source ? this.visit(node.source) : null;

        // Pattern: where(p1) after where(p2) → where(x => p2(x) && p1(x))
        if (
            node.operatorName === 'where' &&
            optimizedSource?.operatorName === 'where'
        ) {
            const [p1] = node.args as [(x: unknown) => boolean];
            const [p2] = optimizedSource.args as [(x: unknown) => boolean];
            return new QueryNode(
                'where',
                [(x: unknown) => p2(x) && p1(x)],  // merged predicate
                optimizedSource.source,              // skip the intermediate node
                'streaming'
            );
        }

        return new QueryNode(
            node.operatorName,
            node.args,
            optimizedSource,
            node.category
        );
    }
}
Why This Is Specifically Powerful Here
Your architecture has a detail that makes Visitor especially well-suited:

Operators register dynamically at runtime via @operator. You don't know all operator names at compile time. That rules out the classic "one visitX method per node type" variant of Visitor. But it makes the single visit(node: IQueryNode): T variant the right call — the visitor inspects node.operatorName and node.category to dispatch.

This means:

External users who write custom operators via createStreamingOperator automatically get their nodes included in any visitor traversal — for free
Your optimization visitors don't need to be updated when new operators are added
The Bigger Picture
The real value is the Open/Closed Principle applied to query analysis:


Without Visitor:
  Add "print chain" feature → modify TyneqBaseEnumerator + every enumerator class
  Add "detect redundancy" → modify again
  Add "estimate cost" → modify again
  → N features × M enumerator classes = NM changes, always touching core code

With Visitor:
  Add "print chain" → write QueryPlanPrinter (1 new class, 0 core changes)
  Add "detect redundancy" → write RedundancyDetector (1 new class)
  Add "estimate cost" → write MemoryCostEstimator (1 new class)
  → N features = N new classes, core never touched
Future use cases enabled by having IQueryNode:

Dev tools: a browser extension that shows the current query plan for debugging
Serialization: serialize a query plan to JSON, deserialize on another machine (remote query execution)
Test assertions: expect(chain.queryNode).toHaveOperator('take') — structural query testing
Telemetry: count how often users chain orderBy after a large from (product analytics)
Query fusion: merge adjacent compatible operators at the factory level before first iteration
The integration cost in your codebase is localized to three places: QueryNode (new file), @operator/createOperator (add one line each), and TyneqEnumerable.createEnumerable (accept an optional node). Enumerators are untouched.