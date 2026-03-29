import type { IQueryNode, QueryPlanVisitor, OperatorCategory, SourceKind } from "../types/queryplan";

/**
 * Concrete `IQueryNode` implementation.
 * One node is created per operator call and linked to its upstream source node,
 * forming a singly-linked list that represents the full query plan.
 *
 * @group QueryPlan
 * @internal
 */
export class QueryNode implements IQueryNode {

    public constructor(
        public readonly operatorName: string,
        public readonly args: readonly unknown[],
        public readonly source: IQueryNode | null,
        public readonly category: OperatorCategory,
        public readonly sourceKind?: SourceKind
    ) {}

    public accept<T>(visitor: QueryPlanVisitor<T>): T {
        return visitor.visit(this);
    }
}
