/**
 * Symbol used to access the query plan node attached to a sequence.
 *
 * @remarks
 * Invisible in normal autocomplete — symbols do not appear in `seq.` completion lists.
 * Import this symbol explicitly to opt in to query-plan inspection:
 *
 * ```ts
 * import { tyneqQueryNode } from 'tyneq';
 *
 * const node = seq[tyneqQueryNode]; // IQueryNode | null
 * QueryPlanPrinter.print(seq[tyneqQueryNode]!);
 * ```
 *
 * @group QueryPlan
 */
export const tyneqQueryNode: unique symbol = Symbol("tyneq.queryNode");

/**
 * The execution category of a query plan node.
 *
 * @remarks
 * - `"source"`    — root node created by `Tyneq.from`, `Tyneq.range`, etc.
 * - `"streaming"` — transforms elements one-at-a-time with O(1) space.
 * - `"buffer"`    — materialises part or all of the sequence before yielding.
 * - `"terminal"`  — evaluates the sequence and returns a concrete value.
 *
 * @group QueryPlan
 */
export type OperatorCategory = "source" | "streaming" | "buffer" | "terminal";

/**
 * A single node in an immutable query plan tree.
 *
 * @remarks
 * Each `IQueryNode` describes one operator in a query chain. Nodes are linked via
 * `source`, forming a singly-linked list ending at a root node where `source === null`.
 *
 * Nodes are metadata only — they carry no execution state and do not affect iteration.
 * Call `node.accept(visitor)` to dispatch to a visitor; the visitor is responsible for
 * recursing into `node.source` as needed.
 *
 * ```ts
 * import { tyneqQueryNode } from 'tyneq';
 *
 * const node = seq[tyneqQueryNode];
 * // node describes the last operator applied to seq
 * // node.source describes the operator before it, and so on
 * ```
 *
 * @see {@link QueryPlanVisitor} for traversal.
 *
 * @group QueryPlan
 */
export interface IQueryNode {
    /** The registered operator name (e.g., `"where"`, `"select"`, `"from"`). */
    readonly operatorName: string;

    /**
     * The user-supplied arguments passed to this operator, in declaration order.
     * Lambdas are included as-is; use `typeof arg === "function"` to identify them
     * during serialization or display.
     */
    readonly args: readonly unknown[];

    /**
     * The previous node in the chain, or `null` for root (source) nodes.
     * Traverse this chain to walk the full query plan from terminal to source.
     */
    readonly source: IQueryNode | null;

    readonly category: OperatorCategory;

    /**
     * Dispatches this node to a visitor.
     *
     * @typeParam T - Return type of the visitor.
     * @param visitor - The visitor to dispatch to.
     * @returns The result of `visitor.visit(this)`.
     */
    accept<T>(visitor: QueryPlanVisitor<T>): T;
}

/**
 * Visitor that traverses an `IQueryNode` tree and produces a value of type `T`.
 *
 * @remarks
 * Implement this interface to add analysis or transformation over a query plan without
 * modifying any node or operator class.
 *
 * There is intentionally one method — `visit` — rather than one per operator name.
 * Operators are registered dynamically at runtime, so a statically typed
 * `visitWhere` / `visitSelect` / … dispatch table is not feasible.
 *
 * ```ts
 * class QueryPlanPrinter implements QueryPlanVisitor<string> {
 *     visit(node: IQueryNode): string {
 *         const argStr = node.args
 *             .map(a => typeof a === "function" ? "<fn>" : String(a))
 *             .join(", ");
 *         const self = `${node.operatorName}(${argStr})`;
 *         return node.source
 *             ? this.visit(node.source) + "\n  → " + self
 *             : self;
 *     }
 * }
 *
 * const chain = Tyneq.from([1, 2, 3]).where(x => x > 0).select(x => x * 2).take(5);
 * console.log(new QueryPlanPrinter().visit(chain.queryNode!));
 * // from([...])
 * //   → where(<fn>)
 * //   → select(<fn>)
 * //   → take(5)
 * ```
 *
 * @typeParam T - Return type of the visitor (e.g., `string` for printing,
 *   `string[]` for collecting issues, `IQueryNode` for optimizing).
 *
 * @group QueryPlan
 */
export interface QueryPlanVisitor<T> {
    /**
     * Visits a single query node and returns a value of type `T`.
     *
     * @param node - The node to visit. Inspect `node.operatorName`, `node.category`,
     *   `node.args`, and `node.source` to dispatch logic.
     */
    visit(node: IQueryNode): T;
}

/**
 * Options for {@link QueryPlanPrinter}.
 *
 * @group QueryPlan
 */
export interface QueryPlanPrinterOptions {
    /**
     * String prepended before the arrow on each non-root operator line.
     * Default: `"  "` (two spaces).
     */
    indent?: string;

    /**
     * Arrow symbol placed between the indent and the operator name on non-root lines.
     * Default: `"→"`.
     */
    arrow?: string;

    /**
     * Maximum number of array elements to inline before summarising as `[...N items]`.
     * Default: `3`.
     */
    maxInlineArrayItems?: number;
}
