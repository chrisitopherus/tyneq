import { Nullable } from "./utility";

/**
 * Symbol key used to access the {@link QueryPlanNode} on a `TyneqSequence`.
 *
 * @example
 * ```ts
 * import { tyneqQueryNode } from "tyneq";
 * const node = seq[tyneqQueryNode]; // QueryPlanNode | null
 * ```
 *
 * @group QueryPlan
 */
export const tyneqQueryNode: unique symbol = Symbol("tyneq.queryNode");

/**
 * Categories of operators.
 *
 * @remarks
 * String literal types used to classify operator behaviour.
 *
 * @group QueryPlan
 */
export type OperatorCategory = "source" | "streaming" | "buffer" | "terminal";

/**
 * The JavaScript collection type that backs a source node.
 *
 * @group QueryPlan
 */
export type SourceKind = "array" | "set" | "map" | "string" | "other";

/**
 * A node in the query plan tree representing one operator in a pipeline.
 *
 * @remarks
 * Nodes form a linked list via `source`. The head node has `source === null` and represents the data source.
 *
 * @group QueryPlan
 */
export interface QueryPlanNode {
    /** The operator name as registered with the registry. */
    readonly operatorName: string;

    /** The arguments passed to the operator. Functions render as `<fn>` in printed output. */
    readonly args: readonly unknown[];

    /** The upstream node, or `null` for source nodes. */
    readonly source: Nullable<QueryPlanNode>;

    /**
     * Operator category describing behaviour (`"source" | "streaming" | "buffer" | "terminal").
     */
    readonly category: OperatorCategory;

    /**
     * The backing JavaScript collection type for source nodes.
     *
     * @remarks
     * Only meaningful when `category === "source"`. For all other categories this field is
     * `undefined`. Use {@link isSourceNode} to narrow the type before reading this field.
     */
    readonly sourceKind?: SourceKind;

    /**
     * Accepts a visitor and returns its result.
     *
     * @param visitor - The visitor to invoke.
     */
    accept<T>(visitor: QueryPlanVisitor<T>): T;
}

/**
 * Narrows a `QueryPlanNode` to one that is guaranteed to have a `sourceKind`.
 *
 * @remarks
 * `sourceKind` is only present on source nodes (`category === "source"`). Reading it on any
 * other node returns `undefined`. Use this guard before accessing `node.sourceKind` to get
 * proper type narrowing and avoid ambiguous `undefined`.
 *
 * @example
 * ```ts
 * if (isSourceNode(node)) {
 *     console.log(node.sourceKind); // "array" | "set" | "map" | "string" | "other"
 * }
 * ```
 *
 * @group QueryPlan
 */
export function isSourceNode(node: QueryPlanNode): node is QueryPlanNode & { sourceKind: SourceKind } {
    return node.category === "source";
}

/**
 * Visitor for traversing a query plan tree.
 *
 * @typeParam T - The value produced by visiting a node.
 * @group QueryPlan
 */
export interface QueryPlanVisitor<T> {
    /** Called for each node during traversal. */
    visit(node: QueryPlanNode): T;
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
