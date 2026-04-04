import type { QueryPlanNode, QueryPlanVisitor } from "../types/queryplan";

/**
 * Abstract base class for side-effect query plan visitors.
 *
 * @remarks
 * Traverses the node chain from source to terminal (bottom-up), calling
 * {@link QueryPlanWalker.visitNode} once per node. Subclass and override
 * `visitNode` to collect information, log, validate, or serialize the plan.
 *
 * @example
 * ```ts
 * class NodeCounter extends QueryPlanWalker {
 *     public count = 0;
 *     protected visitNode(_node: QueryPlanNode): void { this.count++; }
 * }
 *
 * const counter = new NodeCounter();
 * counter.visit(seq[tyneqQueryNode]!);
 * console.log(counter.count); // number of operators in the pipeline
 * ```
 *
 * @group QueryPlan
 */
export abstract class QueryPlanWalker implements QueryPlanVisitor<void> {

    /**
     * Walks the full chain rooted at `node`, source-to-terminal, calling
     * {@link QueryPlanWalker.visitNode} for each node.
     */
    public visit(node: QueryPlanNode): void {
        if (node.source !== null) {
            this.visit(node.source);
        }

        this.visitNode(node);
    }

    /**
     * Called once per node during traversal, in source-to-terminal order.
     *
     * @param node - The current node being visited.
     */
    protected abstract visitNode(node: QueryPlanNode): void;
}
