import { describe, expect, it } from "vitest";
import { Tyneq, tyneqQueryNode } from "../../../../src";

describe("desc", () => {
    describe("sorting behaviour", () => {
        it("returns elements in descending order when called on orderBy", () => {
            const result = Tyneq.from([3, 1, 2])
                .orderBy((x) => x)
                .desc()
                .toArray();

            expect(result).toEqual([3, 2, 1]);
        });

        it("returns elements in descending order when called on orderByDescending", () => {
            const result = Tyneq.from([3, 1, 2])
                .orderByDescending((x) => x)
                .desc()
                .toArray();

            expect(result).toEqual([3, 2, 1]);
        });

        it("returns the same instance when already descending", () => {
            const seq = Tyneq.from([1]).orderByDescending((x) => x);
            expect(seq.desc()).toBe(seq);
        });

        it("works after thenBy", () => {
            const source = [
                { name: "b", score: 2 },
                { name: "a", score: 2 },
                { name: "c", score: 1 },
            ];

            const result = Tyneq.from(source)
                .orderByDescending((x) => x.score)
                .thenBy((x) => x.name)
                .desc()
                .toArray()
                .map((x) => x.name);

            expect(result).toEqual(["b", "a", "c"]);
        });
    });

    describe("query plan", () => {
        it("rewrites node name from orderBy to orderByDescending", () => {
            const seq = Tyneq.from([1]).orderBy((x) => x).desc();
            expect(seq[tyneqQueryNode]?.operatorName).toBe("orderByDescending");
        });

        it("preserves node name when already orderByDescending", () => {
            const seq = Tyneq.from([1]).orderByDescending((x) => x).desc();
            expect(seq[tyneqQueryNode]?.operatorName).toBe("orderByDescending");
        });

        it("rewrites node name from thenBy to thenByDescending", () => {
            const seq = Tyneq.from([1])
                .orderBy((x) => x)
                .thenBy((x) => x)
                .desc();
            expect(seq[tyneqQueryNode]?.operatorName).toBe("thenByDescending");
        });

        it("preserves node args after rewrite", () => {
            const selector = (x: number) => x;
            const original = Tyneq.from([1]).orderBy(selector);
            const originalArgs = original[tyneqQueryNode]?.args;
            const rewritten = original.desc()[tyneqQueryNode]?.args;
            expect(rewritten).toEqual(originalArgs);
        });
    });
});
