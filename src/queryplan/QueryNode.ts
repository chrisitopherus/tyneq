import type { QueryPlanNode, QueryPlanVisitor, OperatorCategory, SourceKind } from "../types/queryplan";
import type { Nullable } from "../types/utility";

/**
 * Concrete `QueryPlanNode` implementation.
 * One node is created per operator call and linked to its upstream source node,
 * forming a singly-linked list that represents the full query plan.
 *
 * @group QueryPlan
 * @internal
 */
export class QueryNode implements QueryPlanNode {

    public constructor(
        public readonly operatorName: string,
        public readonly args: readonly unknown[],
        public readonly source: Nullable<QueryPlanNode>,
        public readonly category: OperatorCategory,
        public readonly sourceKind?: SourceKind
    ) {}

    public accept<T>(visitor: QueryPlanVisitor<T>): T {
        return visitor.visit(this);
    }
}
