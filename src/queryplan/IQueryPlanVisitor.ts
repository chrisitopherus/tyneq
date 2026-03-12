import type { IQueryNode } from './IQueryNode';

/**
 * Visitor that traverses an `IQueryNode` tree and produces a value of type `T`.
 *
 * @remarks
 * Implement this interface to add new analysis or transformation operations over
 * a query plan without modifying any node or operator class.
 *
 * The visitor receives the full node (including `operatorName`, `category`, `args`,
 * and `source`) and dispatches entirely by inspecting those properties. There is
 * intentionally **one** method — `visit` — rather than one per operator name.
 * This matches Tyneq's open-ended, runtime-registered operator model: operators are
 * registered dynamically, so a statically typed `visitWhere` / `visitSelect` /…
 * dispatch table is not feasible or desirable.
 *
 * ## Implementing a visitor
 *
 * ```ts
 * class QueryPlanPrinter implements IQueryPlanVisitor<string> {
 *     visit(node: IQueryNode): string {
 *         const argStr = node.args
 *             .map(a => typeof a === 'function' ? '<fn>' : String(a))
 *             .join(', ');
 *         const self = `${node.operatorName}(${argStr})`;
 *         return node.source
 *             ? this.visit(node.source) + '\n  → ' + self
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
 * @typeParam T - The return type of the visitor (e.g., `string` for printing,
 *   `string[]` for collecting issues, `IQueryNode` for optimizing).
 *
 * @group QueryPlan
 */
export interface IQueryPlanVisitor<T> {
    /**
     * Visits a single query node and returns a value of type `T`.
     *
     * @param node - The node to visit. Inspect `node.operatorName`, `node.category`,
     *   `node.args`, and `node.source` to dispatch logic.
     */
    visit(node: IQueryNode): T;
}
