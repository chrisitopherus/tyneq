import { describe, expect, it } from "vitest";
import { Tyneq, tyneqQueryNode, QueryPlanOptimizer } from "../../../src";
import type { IQueryNode } from "../../../src";

const collectNames = (node: IQueryNode): string[] => {
    const names: string[] = [];
    let cur: IQueryNode | null = node;
    while (cur !== null) { names.unshift(cur.operatorName); cur = cur.source; }

    return names;
};

describe("QueryPlanOptimizer", () => {
    describe("where fusion", () => {
        it("fuses two consecutive where nodes into one", () => {
            const seq = Tyneq.from([1, 2, 3, 4])
                .where((x) => x > 1)
                .where((x) => x < 4);
            const optimized = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
            expect(collectNames(optimized)).toEqual(["from", "where"]);
        });

        it("fused predicate combines both conditions", () => {
            const seq = Tyneq.from([1, 2, 3, 4, 5])
                .where((x) => x > 1)
                .where((x) => x < 5);
            const optimized = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
            const fused = optimized.args[0] as (x: number) => boolean;
            expect(fused(1)).toBe(false); // fails first
            expect(fused(5)).toBe(false); // fails second
            expect(fused(3)).toBe(true);  // passes both
        });

        it("fuses three consecutive where nodes into one", () => {
            const seq = Tyneq.from([1, 2, 3, 4, 5])
                .where((x) => x > 1)
                .where((x) => x < 5)
                .where((x) => x % 2 === 0);
            const optimized = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
            expect(collectNames(optimized)).toEqual(["from", "where"]);
        });

        it("does not fuse non-consecutive where nodes", () => {
            const seq = Tyneq.from([1, 2, 3])
                .where((x) => x > 1)
                .select((x) => x * 2)
                .where((x) => x < 6);
            const optimized = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
            expect(collectNames(optimized)).toEqual(["from", "where", "select", "where"]);
        });
    });

    describe("select fusion", () => {
        it("fuses two consecutive select nodes into one", () => {
            const seq = Tyneq.from([1, 2, 3])
                .select((x) => x * 2)
                .select((x) => x + 1);
            const optimized = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
            expect(collectNames(optimized)).toEqual(["from", "select"]);
        });

        it("fused projection composes both functions", () => {
            const seq = Tyneq.from([1, 2, 3])
                .select((x) => x * 2)
                .select((x) => x + 1);
            const optimized = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
            const fused = optimized.args[0] as (x: number) => number;
            expect(fused(3)).toBe(7); // 3*2=6, 6+1=7
        });

        it("fuses three consecutive select nodes into one", () => {
            const seq = Tyneq.from([1, 2])
                .select((x) => x * 2)
                .select((x) => x + 1)
                .select((x) => x * 3);
            const optimized = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
            expect(collectNames(optimized)).toEqual(["from", "select"]);
        });
    });

    describe("mixed", () => {
        it("fuses both where and select independently", () => {
            const seq = Tyneq.from([1, 2, 3, 4])
                .where((x) => x > 1)
                .where((x) => x < 4)
                .select((x) => x * 2)
                .select((x) => x + 1);
            const optimized = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
            expect(collectNames(optimized)).toEqual(["from", "where", "select"]);
        });

        it("does not affect the live sequence", () => {
            const seq = Tyneq.from([1, 2, 3, 4])
                .where((x) => x > 1)
                .where((x) => x < 4);
            new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
            // original execution is unchanged
            expect(seq.toArray()).toEqual([2, 3]);
        });
    });

    describe("sourceKind", () => {
        it("preserves sourceKind through optimization", () => {
            const seq = Tyneq.from([1, 2]).where((x) => x > 0).where((x) => x < 3);
            const optimized = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
            let sourceNode: IQueryNode = optimized;
            while (sourceNode.source !== null) sourceNode = sourceNode.source;

            expect(sourceNode.sourceKind).toBe("array");
        });
    });
});
