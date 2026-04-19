import type { QueryPlanNode } from "../types/queryplan";
import type { Nullable } from "../types/utility";
import { QueryNode } from "./QueryNode";
import { QueryPlanTransformer } from "./QueryPlanTransformer";

/**
 * A built-in {@link QueryPlanTransformer} that fuses redundant consecutive operators.
 *
 * @remarks
 * **This optimizer rewrites the query plan tree only - it does not affect execution of the
 * original sequence.** The returned `QueryPlanNode` reflects what an optimized pipeline would
 * look like; the live sequence that produced the original plan is unchanged.
 *
 * **Fusion is only semantics-preserving for pure, side-effect-free functions.**
 * If a predicate or projection has side effects (e.g. logging, mutation), fusing two nodes into
 * one changes when and how many times those effects fire. For example, in a fused `where`, the
 * second predicate is never called for items that fail the first - any mutation inside the second
 * predicate is skipped for those items. Do not use this optimizer on pipelines with impure
 * predicates or projections.
 *
 * ### Fusions applied
 *
 * | Pattern | Result |
 * |---------|--------|
 * | `where(a) -> where(b)` | `where(x => a(x) && b(x))` |
 * | `select(a) -> select(b)` | `select(x => b(a(x)))` |
 *
 * Additional fusions can be added by subclassing and overriding
 * {@link QueryPlanTransformer.transformNode}.
 *
 * @example
 * ```ts
 * import { Tyneq, tyneqQueryNode, QueryPlanOptimizer, QueryPlanPrinter } from "tyneq";
 *
 * const seq = Tyneq.from([1, 2, 3])
 *     .where(x => x > 1)
 *     .where(x => x < 3)
 *     .select(x => x * 2)
 *     .select(x => x + 1);
 *
 * const original = seq[tyneqQueryNode]!;
 * const optimized = new QueryPlanOptimizer().visit(original);
 *
 * console.log(QueryPlanPrinter.print(original));
 * // from([...])
 * //   -> where(<fn>)
 * //   -> where(<fn>)
 * //   -> select(<fn>)
 * //   -> select(<fn>)
 *
 * console.log(QueryPlanPrinter.print(optimized));
 * // from([...])
 * //   -> where(<fn>)
 * //   -> select(<fn>)
 * ```
 *
 * @group QueryPlan
 */
export class QueryPlanOptimizer extends QueryPlanTransformer {

    protected override transformNode(node: QueryPlanNode, source: Nullable<QueryPlanNode>): QueryPlanNode {
        if (node.operatorName === "where" && source?.operatorName === "where") {
            return this.fuseWhere(node, source);
        }

        if (node.operatorName === "select" && source?.operatorName === "select") {
            return this.fuseSelect(node, source);
        }

        return super.transformNode(node, source);
    }

    /**
     * @remarks Fusion is only semantics-preserving for pure, side-effect-free predicates.
     */
    private fuseWhere(node: QueryPlanNode, source: QueryPlanNode): QueryPlanNode {
        const predA = source.args[0] as (x: unknown) => boolean;
        const predB = node.args[0] as (x: unknown) => boolean;
        const fused = (x: unknown): boolean => predA(x) && predB(x);
        return new QueryNode("where", [fused], source.source, "streaming");
    }

    /**
     * @remarks Fusion is only semantics-preserving for pure, side-effect-free projections.
     */
    private fuseSelect(node: QueryPlanNode, source: QueryPlanNode): QueryPlanNode {
        const projA = source.args[0] as (x: unknown) => unknown;
        const projB = node.args[0] as (x: unknown) => unknown;
        const fused = (x: unknown): unknown => projB(projA(x));
        return new QueryNode("select", [fused], source.source, "streaming");
    }
}
