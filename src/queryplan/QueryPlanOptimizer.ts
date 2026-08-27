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
 * **Fusion preserves call order, call count, and interleaving - including for impure
 * (side-effecting) predicates and projections.** In the unfused pull pipeline, `where(a).where(b)`
 * evaluates each upstream element `x` as: `a(x)`, then `b(x)` only if `a(x)` is truthy - the
 * inner `where(a)` never yields `x` to the outer `where(b)` otherwise. This is exactly the
 * evaluation rule of the fused predicate `a(x) && b(x)`, so the two are behaviorally identical,
 * side effects included. The same argument holds for `select` fusion: unfused, `a(x)` is computed
 * and its result immediately passed to `b` before the next upstream pull - identical to
 * `b(a(x))`. The one thing fusion changes is the query plan's shape: two `<fn>` nodes become
 * one, so plan-diffing tools and per-operator node counts see a different tree than the original.
 * The constraint any future fusion rule must preserve to keep this guarantee is: never reorder
 * or elide operators across a node boundary, only merge directly adjacent same-shape nodes -
 * this adjacency requirement is what makes the argument above sound.
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
     * @remarks Behavior-preserving even for impure predicates - see the class-level `@remarks`.
     */
    private fuseWhere(node: QueryPlanNode, source: QueryPlanNode): QueryPlanNode {
        const predA = source.args[0] as (x: unknown) => boolean;
        const predB = node.args[0] as (x: unknown) => boolean;
        const fused = (x: unknown): boolean => predA(x) && predB(x);
        return new QueryNode("where", [fused], source.source, "streaming");
    }

    /**
     * @remarks Behavior-preserving even for impure projections - see the class-level `@remarks`.
     */
    private fuseSelect(node: QueryPlanNode, source: QueryPlanNode): QueryPlanNode {
        const projA = source.args[0] as (x: unknown) => unknown;
        const projB = node.args[0] as (x: unknown) => unknown;
        const fused = (x: unknown): unknown => projB(projA(x));
        return new QueryNode("select", [fused], source.source, "streaming");
    }
}
