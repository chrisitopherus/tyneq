import type { QueryPlanNode, QueryPlanTraversalDirection, QueryPlanVisitor } from "../types/queryplan";

/**
 * Concrete base class for side-effect query plan visitors.
 *
 * @remarks
 * Traverses the node chain calling {@link QueryPlanWalker.visitNode} once per node.
 * The traversal direction defaults to `"source-to-terminal"` (bottom-up: `from` before
 * `where` before `select`) and can be changed to `"terminal-to-source"` (top-down) via
 * the constructor.
 *
 * ### Usage patterns
 *
 * **Direct instantiation with a callback** -- no subclass needed for simple traversals:
 * ```ts
 * const names: string[] = [];
 * new QueryPlanWalker(node => names.push(node.operatorName)).visit(plan);
 * ```
 *
 * **Subclass** -- for stateful walkers that accumulate results across nodes:
 * ```ts
 * class NodeCounter extends QueryPlanWalker {
 *     public count = 0;
 *     protected override visitNode(_node: QueryPlanNode): void { this.count++; }
 * }
 *
 * const counter = new NodeCounter();
 * counter.visit(seq[tyneqQueryNode]!);
 * console.log(counter.count); // number of operators in the pipeline
 * ```
 *
 * **Top-down traversal:**
 * ```ts
 * new QueryPlanWalker(
 *     node => console.log(node.operatorName),
 *     "terminal-to-source"
 * ).visit(plan);
 * ```
 *
 * @group QueryPlan
 */
export class QueryPlanWalker implements QueryPlanVisitor<void> {

    private readonly callback: ((node: QueryPlanNode) => void) | undefined;
    private readonly direction: QueryPlanTraversalDirection;

    /**
     * @param callback - Optional callback invoked by the default {@link visitNode} for each
     *   node. Ignored when `visitNode` is overridden without calling `super.visitNode`.
     * @param direction - Traversal direction. Defaults to `"source-to-terminal"`.
     */
    public constructor(
        callback?: (node: QueryPlanNode) => void,
        direction: QueryPlanTraversalDirection = "source-to-terminal"
    ) {
        this.callback = callback;
        this.direction = direction;
    }

    /**
     * Walks the full chain rooted at `node`, calling {@link visitNode} for each node
     * in the configured direction.
     */
    public visit(node: QueryPlanNode): void {
        if (this.direction === "source-to-terminal") {
            if (node.source !== null) {
                this.visit(node.source);
            }

            this.visitNode(node);
        } else {
            this.visitNode(node);

            if (node.source !== null) {
                this.visit(node.source);
            }
        }
    }

    /**
     * Called once per node during traversal.
     *
     * @remarks
     * The default implementation fires the callback passed to the constructor (if any).
     * Override this method in a subclass to provide custom behaviour. Subclasses that
     * override this method decide whether to call `super.visitNode(node)` to also fire
     * the constructor callback.
     *
     * @param node - The current node being visited.
     */
    protected visitNode(node: QueryPlanNode): void {
        this.callback?.(node);
    }
}
