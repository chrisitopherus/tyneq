import { describe, expect, it } from "vitest";
import { Tyneq, tyneqQueryNode, QueryPlanTransformer, QueryNode } from "../../../src";
import type { IQueryNode } from "../../../src";

describe("QueryPlanTransformer", () => {
    it("identity transform preserves chain length and operator names", () => {
        const seq = Tyneq.from([1, 2, 3]).where((x) => x > 1).select((x) => x * 2);
        const original = seq[tyneqQueryNode]!;
        const result = new QueryPlanTransformer().visit(original);

        const collect = (n: IQueryNode): string[] => {
            const names: string[] = [];
            let cur: IQueryNode | null = n;
            while (cur !== null) { names.unshift(cur.operatorName); cur = cur.source; }

            return names;
        };

        expect(collect(result)).toEqual(collect(original));
    });

    it("identity transform produces new node instances (immutable)", () => {
        const seq = Tyneq.from([1]).select((x) => x);
        const original = seq[tyneqQueryNode]!;
        const result = new QueryPlanTransformer().visit(original);
        expect(result).not.toBe(original);
        expect(result.source).not.toBe(original.source);
    });

    it("subclass can rewrite a specific operator name", () => {
        class RenameWhere extends QueryPlanTransformer {
            protected override transformNode(node: IQueryNode, source: IQueryNode | null): IQueryNode {
                if (node.operatorName === "where") {
                    return new QueryNode("filter", node.args, source, node.category);
                }

                return super.transformNode(node, source);
            }
        }

        const seq = Tyneq.from([1, 2]).where((x) => x > 1);
        const result = new RenameWhere().visit(seq[tyneqQueryNode]!);
        expect(result.operatorName).toBe("filter");
        expect(result.source?.operatorName).toBe("from");
    });

    it("subclass can remove a node by returning source", () => {
        class RemoveSelect extends QueryPlanTransformer {
            protected override transformNode(node: IQueryNode, source: IQueryNode | null): IQueryNode {
                if (node.operatorName === "select") return source!;

                return super.transformNode(node, source);
            }
        }

        const seq = Tyneq.from([1]).select((x) => x).where((x) => x > 0);
        const result = new RemoveSelect().visit(seq[tyneqQueryNode]!);
        // chain: from → select → where; after removing select: from → where
        expect(result.operatorName).toBe("where");
        expect(result.source?.operatorName).toBe("from");
        expect(result.source?.source).toBeNull();
    });

    it("preserves sourceKind through identity transform", () => {
        const seq = Tyneq.from([1, 2, 3]).where((x) => x > 1);
        const original = seq[tyneqQueryNode]!;
        const result = new QueryPlanTransformer().visit(original);
        // walk to source node
        let sourceNode: IQueryNode = result;
        while (sourceNode.source !== null) sourceNode = sourceNode.source;

        expect(sourceNode.sourceKind).toBe("array");
    });
});
