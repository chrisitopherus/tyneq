import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentOutOfRangeError, ArgumentNullError, ArgumentError } from "../../../../src";

// Tyneq.repeat

describe("Tyneq.repeat", () => {
    describe("normal usage", () => {
        it("yields the value the specified number of times", () => {
            expect(Tyneq.repeat("x", 3).toArray()).toEqual(["x", "x", "x"]);
        });

        it("works with numeric values", () => {
            expect(Tyneq.repeat(42, 4).toArray()).toEqual([42, 42, 42, 42]);
        });

        it("works with object references", () => {
            const obj = { id: 1 };
            const result = Tyneq.repeat(obj, 2).toArray();
            expect(result).toHaveLength(2);
            expect(result[0]).toBe(obj);
            expect(result[1]).toBe(obj);
        });
    });

    describe("edge cases", () => {
        it("returns an empty sequence when count is 0", () => {
            expect(Tyneq.repeat("x", 0).toArray()).toEqual([]);
        });

        it("returns a single-element sequence when count is 1", () => {
            expect(Tyneq.repeat("a", 1).toArray()).toEqual(["a"]);
        });

        it("is re-iterable", () => {
            const seq = Tyneq.repeat(1, 3);
            expect(seq.toArray()).toEqual([1, 1, 1]);
            expect(seq.toArray()).toEqual([1, 1, 1]);
        });

        it("works with null as the repeated value", () => {
            expect(Tyneq.repeat(null, 2).toArray()).toEqual([null, null]);
        });
    });

    describe("invalid arguments", () => {
        it("throws ArgumentOutOfRangeError when count is negative", () => {
            expect(() => Tyneq.repeat("x", -1)).toThrow(ArgumentOutOfRangeError);
        });
    });
});

// Tyneq.generate

describe("Tyneq.generate", () => {
    describe("normal usage", () => {
        it("produces a sequence by applying the selector to the previous value", () => {
            expect(Tyneq.generate(1, (x) => x * 2, 4).toArray()).toEqual([2, 4, 8, 16]);
        });

        it("passes the index as the second argument to the selector", () => {
            const indices: number[] = [];
            Tyneq.generate(0, (_, i) => { indices.push(i); return i; }, 3).toArray();
            expect(indices).toEqual([0, 1, 2]);
        });

        it("the seed is not yielded -- only selector results are", () => {
            const result = Tyneq.generate(10, (x) => x + 1, 3).toArray();
            expect(result).toEqual([11, 12, 13]);
        });

        it("produces a string sequence", () => {
            expect(Tyneq.generate("a", (s) => s + "a", 3).toArray()).toEqual(["aa", "aaa", "aaaa"]);
        });
    });

    describe("edge cases", () => {
        it("returns an empty sequence when count is 0", () => {
            expect(Tyneq.generate(0, (x) => x + 1, 0).toArray()).toEqual([]);
        });

        it("returns a single element when count is 1", () => {
            expect(Tyneq.generate(5, (x) => x * 2, 1).toArray()).toEqual([10]);
        });

        it("produces an infinite sequence bounded by take when count is omitted", () => {
            const result = Tyneq.generate(1, (x) => x + 1).take(5).toArray();
            expect(result).toEqual([2, 3, 4, 5, 6]);
        });

        it("is re-iterable", () => {
            const seq = Tyneq.generate(0, (x) => x + 1, 3);
            expect(seq.toArray()).toEqual([1, 2, 3]);
            expect(seq.toArray()).toEqual([1, 2, 3]);
        });
    });

    describe("invalid arguments", () => {
        it("throws ArgumentNullError when next is null", () => {
            expect(() => Tyneq.generate(0, null as any, 3)).toThrow(ArgumentNullError);
        });

        it("throws ArgumentError when next is undefined", () => {
            expect(() => Tyneq.generate(0, undefined as any, 3)).toThrow(ArgumentError);
        });
    });
});

// Tyneq.concat

describe("Tyneq.concat", () => {
    describe("normal usage", () => {
        it("concatenates two arrays in order", () => {
            expect(Tyneq.concat([1, 2], [3, 4]).toArray()).toEqual([1, 2, 3, 4]);
        });

        it("concatenates three sources in order", () => {
            expect(Tyneq.concat([1], [2, 3], [4, 5, 6]).toArray()).toEqual([1, 2, 3, 4, 5, 6]);
        });

        it("accepts any iterable as a source", () => {
            expect(Tyneq.concat(new Set([1, 2]), [3]).toArray()).toEqual([1, 2, 3]);
        });

        it("accepts a single source", () => {
            expect(Tyneq.concat([1, 2, 3]).toArray()).toEqual([1, 2, 3]);
        });
    });

    describe("edge cases", () => {
        it("returns an empty sequence when called with no arguments", () => {
            expect(Tyneq.concat().toArray()).toEqual([]);
        });

        it("skips empty sources in the middle", () => {
            expect(Tyneq.concat([1], [], [2]).toArray()).toEqual([1, 2]);
        });

        it("returns empty when all sources are empty", () => {
            expect(Tyneq.concat([], [], []).toArray()).toEqual([]);
        });

        it("is re-iterable", () => {
            const seq = Tyneq.concat([1, 2], [3]);
            expect(seq.toArray()).toEqual([1, 2, 3]);
            expect(seq.toArray()).toEqual([1, 2, 3]);
        });

        it("preserves element order within each source", () => {
            expect(Tyneq.concat([3, 1], [4, 1, 5]).toArray()).toEqual([3, 1, 4, 1, 5]);
        });
    });
});
