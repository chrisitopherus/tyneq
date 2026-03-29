import { describe, expect, it } from "vitest";
import { Tyneq, tyneqQueryNode, QueryPlanWalker } from "../../../src";
import type { IQueryNode } from "../../../src";

class NameCollector extends QueryPlanWalker {
    public readonly names: string[] = [];
    protected visitNode(node: IQueryNode): void {
        this.names.push(node.operatorName);
    }
}

describe("QueryPlanWalker", () => {
    it("visits nodes in source-to-terminal order", () => {
        const seq = Tyneq.from([1, 2, 3]).where((x) => x > 1).select((x) => x * 2);
        const collector = new NameCollector();
        collector.visit(seq[tyneqQueryNode]!);
        expect(collector.names).toEqual(["from", "where", "select"]);
    });

    it("visits a single source node", () => {
        const seq = Tyneq.from([1]);
        const collector = new NameCollector();
        collector.visit(seq[tyneqQueryNode]!);
        expect(collector.names).toEqual(["from"]);
    });

    it("counts all nodes in the chain", () => {
        const seq = Tyneq.range(1, 5)
            .where((x) => x > 1)
            .select((x) => x * 2)
            .skip(1);
        const collector = new NameCollector();
        collector.visit(seq[tyneqQueryNode]!);
        expect(collector.names).toHaveLength(4);
    });
});
