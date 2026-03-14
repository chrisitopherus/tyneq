import type { IQueryNode, IQueryPlanVisitor, OperatorCategory } from '../types/queryplan';

/**
 * Standard immutable implementation of {@link IQueryNode}.
 *
 * @remarks
 * Instances are created automatically by the operator registration infrastructure
 * (`@operator`, `@terminal`, `createOperator`, `createGeneratorOperator`) and by
 * `Tyneq.from` / `Tyneq.range` for root source nodes.
 *
 * Construct `QueryNode` directly only when producing modified nodes inside a
 * {@link IQueryPlanVisitor} — for example, in a query optimizer:
 *
 * ```ts
 * class QueryOptimizer implements IQueryPlanVisitor<IQueryNode> {
 *     visit(node: IQueryNode): IQueryNode {
 *         const optimizedSource = node.source ? this.visit(node.source) : null;
 *
 *         // Merge adjacent where().where() into a single predicate
 *         if (node.operatorName === 'where' && optimizedSource?.operatorName === 'where') {
 *             const [p1] = node.args as [(x: unknown) => boolean];
 *             const [p2] = optimizedSource.args as [(x: unknown) => boolean];
 *             return new QueryNode('where', [(x: unknown) => p2(x) && p1(x)], optimizedSource.source, 'streaming');
 *         }
 *
 *         return new QueryNode(node.operatorName, node.args, optimizedSource, node.category);
 *     }
 * }
 * ```
 *
 * @group QueryPlan
 */
export class QueryNode implements IQueryNode {
    /**
     * @param operatorName - The registered operator name (e.g., `'where'`, `'from'`).
     * @param args         - The user arguments passed to this operator.
     * @param source       - The previous node in the chain, or `null` for root nodes.
     * @param category     - The execution category of this operator.
     */
    constructor(
        public readonly operatorName: string,
        public readonly args: readonly unknown[],
        public readonly source: IQueryNode | null,
        public readonly category: OperatorCategory
    ) {}

    accept<T>(visitor: IQueryPlanVisitor<T>): T {
        return visitor.visit(this);
    }
}
