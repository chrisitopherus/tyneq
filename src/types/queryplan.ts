
/**
 * Symbol key used to access the {@link IQueryNode} on a `TyneqSequence`.
 *
 * @example
 * ```ts
 * import { tyneqQueryNode } from "tyneq";
 * const node = seq[tyneqQueryNode]; // IQueryNode | null
 * ```
 *
 * @group QueryPlan
 */
export const tyneqQueryNode: unique symbol = Symbol("tyneq.queryNode");

/**
 * Category of an operator node in the query plan tree.
 *
 * @group QueryPlan
 */
export type OperatorCategory = "source" | "streaming" | "buffer" | "terminal";

/**
 * A node in the query plan tree representing one operator in a pipeline.
 *
 * @remarks
 * Nodes form a linked list via `source`. The head node has `source === null` and represents the data source.
 *
 * @group QueryPlan
 */
export interface IQueryNode {
    /** The operator name as registered with the registry. */
    readonly operatorName: string;

    /** The arguments passed to the operator. Functions render as `<fn>` in printed output. */
    readonly args: readonly unknown[];

    /** The upstream node, or `null` for source nodes. */
    readonly source: IQueryNode | null;

    readonly category: OperatorCategory;

    /**
     * Accepts a visitor and returns its result.
     *
     * @param visitor - The visitor to invoke.
     */
    accept<T>(visitor: QueryPlanVisitor<T>): T;
}

/**
 * Visitor for traversing a query plan tree.
 *
 * @typeParam T - The value produced by visiting a node.
 * @group QueryPlan
 */
export interface QueryPlanVisitor<T> {
    /** Called for each node during traversal. */
    visit(node: IQueryNode): T;
}

/**
 * Options for {@link QueryPlanPrinter}.
 *
 * @group QueryPlan
 */
export interface QueryPlanPrinterOptions {
    /** Indentation string per nesting level. Defaults to `"  "` (two spaces). */
    indent?: string;

    /** Arrow string between levels. Defaults to `"->"`. */
    arrow?: string;

    /** Maximum number of array items to render inline. Defaults to `3`. */
    maxInlineArrayItems?: number;
}
