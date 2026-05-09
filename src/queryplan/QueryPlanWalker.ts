import type { QueryPlanNode, QueryPlanTraversalDirection, QueryPlanVisitor, QueryPlanWalkerOptions } from "../types/queryplan";
import { Maybe } from "../types/utility";

/**
 * Concrete base class for side-effect query plan visitors.
 *
 * @remarks
 * Traverses the node chain calling {@link QueryPlanWalker.visitNode} once per node.
 * The traversal direction defaults to `"source-to-terminal"` (bottom-up: `from` before
 * `where` before `select`) and can be changed to `"terminal-to-source"` (top-down) via
 * the options object.
 *
 * ### Usage patterns
 *
 * **Direct instantiation with a callback** - no subclass needed for simple traversals:
 * ```ts
 * const names: string[] = [];
 * new QueryPlanWalker({ callback: node => names.push(node.operatorName) }).visit(plan);
 * ```
 *
 * **Subclass** - for stateful walkers that accumulate results across nodes:
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
 * new QueryPlanWalker({
 *     callback: node => console.log(node.operatorName),
 *     direction: "terminal-to-source",
 * }).visit(plan);
 * ```
 *
 * **Subclass with direction override** - pass options to `super`:
 * ```ts
 * class ReverseCollector extends QueryPlanWalker {
 *     public readonly names: string[] = [];
 *     public constructor() { super({ direction: "terminal-to-source" }); }
 *     protected override visitNode(node: QueryPlanNode): void {
 *         this.names.push(node.operatorName);
 *     }
 * }
 * ```
 *
 * @group QueryPlan
 */
export class QueryPlanWalker implements QueryPlanVisitor<void> {

    private readonly callback: Maybe<(node: QueryPlanNode) => void>;
    private readonly direction: QueryPlanTraversalDirection;

    /**
     * @param options - Optional configuration for the walker.
     */
    public constructor(options?: QueryPlanWalkerOptions) {
        this.callback = options?.callback;
        this.direction = options?.direction ?? "source-to-terminal";
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
     * The default implementation fires the callback passed via options (if any).
     * Override this method in a subclass to provide custom behaviour. Subclasses that
     * override this method decide whether to call `super.visitNode(node)` to also fire
     * the options callback.
     *
     * @param node - The current node being visited.
     */
    protected visitNode(node: QueryPlanNode): void {
        this.callback?.(node);
    }
}
