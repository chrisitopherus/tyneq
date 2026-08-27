import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentError, ArgumentNullError, ArgumentTypeError, InvalidOperationError } from "../../../src";

describe("Tyneq.from", () => {
    describe("normal usage", () => {
        it("wraps an array into a sequence", () => {
            expect(Tyneq.from([1, 2, 3]).toArray()).toEqual([1, 2, 3]);
        });

        it("wraps a Set into a sequence", () => {
            expect(Tyneq.from(new Set([1, 2, 3])).toArray()).toEqual([1, 2, 3]);
        });

        it("wraps a Map into a sequence of entries", () => {
            const map = new Map([["a", 1], ["b", 2]]);
            expect(Tyneq.from(map).toArray()).toEqual([["a", 1], ["b", 2]]);
        });

        it("wraps a string into a sequence of characters", () => {
            expect(Tyneq.from("abc").toArray()).toEqual(["a", "b", "c"]);
        });

        it("wraps a generator into a sequence", () => {
            function* gen() { yield 10; yield 20; }
            expect(Tyneq.from(gen()).toArray()).toEqual([10, 20]);
        });

        it("preserves element order", () => {
            expect(Tyneq.from([3, 1, 4, 1, 5]).toArray()).toEqual([3, 1, 4, 1, 5]);
        });
    });

    describe("edge cases", () => {
        it("wraps an empty array into an empty sequence", () => {
            expect(Tyneq.from([]).toArray()).toEqual([]);
        });

        it("wraps an empty Set into an empty sequence", () => {
            expect(Tyneq.from(new Set()).toArray()).toEqual([]);
        });

        it("is re-iterable when backed by an array", () => {
            const seq = Tyneq.from([1, 2, 3]);
            expect(seq.toArray()).toEqual([1, 2, 3]);
            expect(seq.toArray()).toEqual([1, 2, 3]);
        });

        it("supports chaining operators", () => {
            expect(Tyneq.from([1, 2, 3, 4]).where((x) => x % 2 === 0).toArray()).toEqual([2, 4]);
        });
    });

    describe("invalid arguments", () => {
        it("throws ArgumentNullError when source is null", () => {
            expect(() => Tyneq.from(null as any)).toThrow(ArgumentNullError);
        });

        it("throws ArgumentError when source is undefined", () => {
            expect(() => Tyneq.from(undefined as any)).toThrow(ArgumentError);
        });

        it("throws ArgumentTypeError when source is not iterable", () => {
            expect(() => Tyneq.from(42 as any)).toThrow(ArgumentTypeError);
        });

        it("throws ArgumentTypeError when source is a plain object", () => {
            expect(() => Tyneq.from({} as any)).toThrow(ArgumentTypeError);
        });
    });

    describe("one-shot iterables (F3)", () => {
        it("throws InvalidOperationError on the second iteration of a generator object, instead of silently returning []", () => {
            function* gen() { yield 1; yield 2; }
            const seq = Tyneq.from(gen());

            expect(seq.toArray()).toEqual([1, 2]);
            expect(() => seq.toArray()).toThrow(InvalidOperationError);
        });

        it("throws InvalidOperationError on the second getEnumerator() call directly", () => {
            function* gen() { yield 1; }
            const seq = Tyneq.from(gen());

            const first = seq.getEnumerator();
            expect(first.next()).toEqual({ done: false, value: 1 });
            expect(first.next()).toEqual({ done: true, value: undefined });

            expect(() => seq.getEnumerator()).toThrow(InvalidOperationError);
        });

        it("does not throw on the first iteration even though the generator is one-shot", () => {
            function* gen() { yield 1; yield 2; yield 3; }
            expect(() => Tyneq.from(gen()).toArray()).not.toThrow();
        });

        it("treats Map.prototype.entries() as one-shot (a built-in iterator-as-iterable)", () => {
            const map = new Map([["a", 1], ["b", 2]]);
            const seq = Tyneq.from(map.entries());

            expect(seq.toArray()).toEqual([["a", 1], ["b", 2]]);
            expect(() => seq.toArray()).toThrow(InvalidOperationError);
        });

        it("does not affect re-iterability of an ordinary array source", () => {
            const seq = Tyneq.from([1, 2, 3]);
            expect(seq.toArray()).toEqual([1, 2, 3]);
            expect(seq.toArray()).toEqual([1, 2, 3]);
            expect(seq.toArray()).toEqual([1, 2, 3]);
        });

        it("does not affect re-iterability of a Set source", () => {
            const seq = Tyneq.from(new Set([1, 2, 3]));
            expect(seq.toArray()).toEqual([1, 2, 3]);
            expect(seq.toArray()).toEqual([1, 2, 3]);
        });

        it("does not affect re-iterability of a custom iterable whose [Symbol.iterator]() returns a fresh iterator each call", () => {
            const values = [1, 2, 3];
            const customIterable: Iterable<number> = {
                [Symbol.iterator]: () => values[Symbol.iterator]()
            };

            const seq = Tyneq.from(customIterable);
            expect(seq.toArray()).toEqual([1, 2, 3]);
            expect(seq.toArray()).toEqual([1, 2, 3]);
        });

        it("chaining operators after a one-shot source still throws on the second full iteration", () => {
            function* gen() { yield 1; yield 2; yield 3; yield 4; }
            const seq = Tyneq.from(gen()).where((x) => x % 2 === 0);

            expect(seq.toArray()).toEqual([2, 4]);
            expect(() => seq.toArray()).toThrow(InvalidOperationError);
        });
    });
});
