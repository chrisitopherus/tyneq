import type { QueryPlanNode, QueryPlanVisitor } from "../types/queryplan";
import { QueryNode } from "./QueryNode";
import type { Nullable } from "../types/utility";

/**
 * Base class for immutable query plan rewriting.
 *
 * @remarks
 * Recursively rebuilds the node chain, calling {@link QueryPlanTransformer.transformNode}
 * once per node. The default implementation is an **identity transform** — every node is
 * reconstructed with the same data, producing a structurally equivalent copy.
 *
 * Subclasses override `transformNode` to intercept specific operators. Three rewrite
 * patterns are possible:
 *
 * - **Rewrite a node** — return a new `QueryNode` with different `operatorName` or `args`
 * - **Remove a node** — return `source` directly, skipping this node
 * - **Collapse two nodes into one** — use `source` as the new node's `source` (fusing
 *   the current node with its already-transformed predecessor)
 *
 * @example
 * ```ts
 * // Rename all 'where' nodes to 'filter' in the plan view
 * class RenameWhere extends QueryPlanTransformer {
 *     protected override transformNode(node: QueryPlanNode, source: QueryPlanNode | null): QueryPlanNode {
 *         if (node.operatorName === "where") {
 *             return new QueryNode("filter", node.args, source, node.category);
 *         }
 *         return super.transformNode(node, source);
 *     }
 * }
 * ```
 *
 * @group QueryPlan
 */
export class QueryPlanTransformer implements QueryPlanVisitor<QueryPlanNode> {

    /**
     * Transforms the full chain rooted at `node` and returns the new root node.
     *
     * @remarks
     * Processes source-first (bottom-up): the source chain is fully transformed before
     * `transformNode` is called for the current node. This means `source` passed to
     * `transformNode` is always already the transformed predecessor.
     */
    public visit(node: QueryPlanNode): QueryPlanNode {
        const transformedSource = node.source !== null ? this.visit(node.source) : null;
        return this.transformNode(node, transformedSource);
    }

    /**
     * Transforms a single node. Override to intercept specific operators.
     *
     * @remarks
     * The default implementation reconstructs the node with identical data (identity transform).
     * `source` is the already-transformed predecessor — use it as the `source` of any returned
     * node to preserve chain continuity.
     *
     * @param node - The original node (unmodified).
     * @param source - The transformed predecessor, or `null` for source nodes.
     */
    protected transformNode(node: QueryPlanNode, source: Nullable<QueryPlanNode>): QueryPlanNode {
        return new QueryNode(node.operatorName, node.args, source, node.category, node.sourceKind);
    }
}
