import type { IQueryPlanVisitor } from './IQueryPlanVisitor';

/**
 * The execution category of an operator node in a query plan.
 *
 * @remarks
 * - `'source'`    — root nodes created by `Tyneq.from`, `Tyneq.range`, etc.
 * - `'streaming'` — transforms elements one-at-a-time with O(1) space.
 * - `'buffer'` — materialises part or all of the sequence before yielding.
 * - `'terminal'`  — (reserved) evaluates the sequence and returns a concrete value.
 *
 * @group QueryPlan
 */
export type OperatorCategory = 'source' | 'streaming' | 'buffer' | 'terminal';

/**
 * A single node in an immutable query plan tree.
 *
 * @remarks
 * Each `IQueryNode` describes **one operator** in a query chain. The tree is built
 * up as operators are applied — `source` points to the previous node, forming a
 * linked list ending at a root source node (`source === null`).
 *
 * Nodes are **metadata only** — they carry no execution state and do not affect
 * how the sequence is iterated. They exist purely for inspection, debugging, and
 * analysis by {@link IQueryPlanVisitor} implementations.
 *
 * ## Traversal
 *
 * Call `node.accept(visitor)` to dispatch to a visitor. The visitor is responsible
 * for recursing into `node.source` as needed.
 *
 * ```ts
 * const node = seq.queryNode;
 * // node describes the last operator applied to seq
 * // node.source describes the operator before that, and so on
 * ```
 *
 * @group QueryPlan
 */
export interface IQueryNode {
    /** The registered operator name (e.g., `'where'`, `'select'`, `'from'`). */
    readonly operatorName: string;
    /**
     * The user-supplied arguments passed to this operator, in declaration order.
     * Lambdas are included as-is; callers may use `typeof arg === 'function'`
     * to identify them during serialization or display.
     */
    readonly args: readonly unknown[];
    /**
     * The previous node in the chain, or `null` for root (source) nodes.
     *
     * Traverse this chain to walk the full query plan from terminal to source.
     */
    readonly source: IQueryNode | null;
    /** The execution category of this operator. */
    readonly category: OperatorCategory;
    /**
     * Dispatches this node to a {@link IQueryPlanVisitor}.
     *
     * @typeParam T - The return type of the visitor.
     * @param visitor - The visitor to dispatch to.
     * @returns The result of `visitor.visit(this)`.
     */
    accept<T>(visitor: IQueryPlanVisitor<T>): T;
}
