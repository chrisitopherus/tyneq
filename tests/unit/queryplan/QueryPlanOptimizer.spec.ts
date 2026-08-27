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

    describe("fusion is behavior-preserving, including for impure predicates/projections (F7)", () => {
        // The class-level @remarks used to warn that fusion "changes side-effect behavior for
        // impure predicates" - this was wrong. In the unfused pull pipeline, where(a).where(b)
        // already never calls b(x) for an x that fails a(x): the inner where(a) simply never
        // yields x to the outer where(b). That is exactly the evaluation rule of the fused
        // predicate a(x) && b(x). These tests prove the fused and unfused pipelines produce
        // byte-identical call traces, including call counts and skipped calls, for impure
        // (side-effecting) callbacks - not just that the fused predicate "looks reasonable".

        it("where fusion produces the same call trace as the unfused pipeline for impure predicates", () => {
            const source = [1, 2, 3, 4, 5];

            const unfusedTrace: string[] = [];
            const unfusedResult = Tyneq.from(source)
                .where((x) => { unfusedTrace.push(`a(${x})`); return x > 2; })
                .where((x) => { unfusedTrace.push(`b(${x})`); return x < 5; })
                .toArray();

            const fusedTrace: string[] = [];
            const seq = Tyneq.from(source)
                .where((x) => { fusedTrace.push(`a(${x})`); return x > 2; })
                .where((x) => { fusedTrace.push(`b(${x})`); return x < 5; });
            const optimizedNode = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
            const fusedPredicate = optimizedNode.args[0] as (x: number) => boolean;
            const fusedResult = source.filter(fusedPredicate);

            expect(fusedTrace).toEqual(unfusedTrace);
            expect(fusedResult).toEqual(unfusedResult);
        });

        it("select fusion produces the same call trace as the unfused pipeline for impure projections", () => {
            const source = [1, 2, 3];

            const unfusedTrace: string[] = [];
            const unfusedResult = Tyneq.from(source)
                .select((x) => { unfusedTrace.push(`a(${x})`); return x * 2; })
                .select((x) => { unfusedTrace.push(`b(${x})`); return x + 1; })
                .toArray();

            const fusedTrace: string[] = [];
            const seq = Tyneq.from(source)
                .select((x) => { fusedTrace.push(`a(${x})`); return x * 2; })
                .select((x) => { fusedTrace.push(`b(${x})`); return x + 1; });
            const optimizedNode = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
            const fusedProjection = optimizedNode.args[0] as (x: number) => number;
            const fusedResult = source.map(fusedProjection);

            expect(fusedTrace).toEqual(unfusedTrace);
            expect(fusedResult).toEqual(unfusedResult);
        });

        it("fused where does not call the second predicate for an item that fails the first, matching the unfused pipeline", () => {
            const secondCalls: number[] = [];
            const seq = Tyneq.from([1, 2, 3, 4])
                .where((x) => x > 2)
                .where((x) => { secondCalls.push(x); return x < 5; });

            const optimized = new QueryPlanOptimizer().visit(seq[tyneqQueryNode]!);
            const fused = optimized.args[0] as (x: number) => boolean;

            [1, 2, 3, 4].forEach((x) => fused(x));

            // Items 1 and 2 fail the first predicate - second is never called for them,
            // exactly as it never would be in the unfused pipeline either.
            expect(secondCalls).not.toContain(1);
            expect(secondCalls).not.toContain(2);
            expect(secondCalls).toContain(3);
            expect(secondCalls).toContain(4);
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
