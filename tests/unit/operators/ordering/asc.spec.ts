import { describe, expect, it } from "vitest";
import { Tyneq, tyneqQueryNode } from "../../../../src";

describe("asc", () => {
    describe("sorting behaviour", () => {
        it("returns elements in ascending order when called on orderByDescending", () => {
            const result = Tyneq.from([3, 1, 2])
                .orderByDescending((x) => x)
                .asc()
                .toArray();

            expect(result).toEqual([1, 2, 3]);
        });

        it("returns elements in ascending order when called on orderBy", () => {
            const result = Tyneq.from([3, 1, 2])
                .orderBy((x) => x)
                .asc()
                .toArray();

            expect(result).toEqual([1, 2, 3]);
        });

        it("returns the same instance when already ascending", () => {
            const seq = Tyneq.from([1]).orderBy((x) => x);
            expect(seq.asc()).toBe(seq);
        });

        it("works after thenByDescending", () => {
            const source = [
                { name: "b", score: 2 },
                { name: "a", score: 2 },
                { name: "c", score: 1 },
            ];

            const result = Tyneq.from(source)
                .orderBy((x) => x.score)
                .thenByDescending((x) => x.name)
                .asc()
                .toArray()
                .map((x) => x.name);

            expect(result).toEqual(["c", "a", "b"]);
        });
    });

    describe("query plan", () => {
        it("rewrites node name from orderByDescending to orderBy", () => {
            const seq = Tyneq.from([1]).orderByDescending((x) => x).asc();
            expect(seq[tyneqQueryNode]?.operatorName).toBe("orderBy");
        });

        it("preserves node name when already orderBy", () => {
            const seq = Tyneq.from([1]).orderBy((x) => x).asc();
            expect(seq[tyneqQueryNode]?.operatorName).toBe("orderBy");
        });

        it("rewrites node name from thenByDescending to thenBy", () => {
            const seq = Tyneq.from([1])
                .orderBy((x) => x)
                .thenByDescending((x) => x)
                .asc();
            expect(seq[tyneqQueryNode]?.operatorName).toBe("thenBy");
        });

        it("preserves node args after rewrite", () => {
            const selector = (x: number) => x;
            const original = Tyneq.from([1]).orderByDescending(selector);
            const originalArgs = original[tyneqQueryNode]?.args;
            const rewritten = original.asc()[tyneqQueryNode]?.args;
            expect(rewritten).toEqual(originalArgs);
        });
    });
});
