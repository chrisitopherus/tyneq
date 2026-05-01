import { describe, expect, it } from "vitest";
import { Tyneq, TyneqComparer } from "../../../src";

describe("TyneqComparer.caseInsensitiveComparer", () => {
    describe("equality (returns 0)", () => {
        it("treats identical strings as equal", () => {
            expect(TyneqComparer.caseInsensitiveComparer("apple", "apple")).toBe(0);
        });

        it("treats the same word in different cases as equal", () => {
            expect(TyneqComparer.caseInsensitiveComparer("apple", "Apple")).toBe(0);
            expect(TyneqComparer.caseInsensitiveComparer("Apple", "apple")).toBe(0);
            expect(TyneqComparer.caseInsensitiveComparer("APPLE", "apple")).toBe(0);
        });

        it("treats empty strings as equal", () => {
            expect(TyneqComparer.caseInsensitiveComparer("", "")).toBe(0);
        });
    });

    describe("ordering (sign of result)", () => {
        it("returns negative when a sorts before b", () => {
            expect(TyneqComparer.caseInsensitiveComparer("apple", "banana")).toBeLessThan(0);
        });

        it("returns positive when a sorts after b", () => {
            expect(TyneqComparer.caseInsensitiveComparer("banana", "apple")).toBeGreaterThan(0);
        });

        it("ordering is case-insensitive (mixed case does not affect sort position)", () => {
            const lower = TyneqComparer.caseInsensitiveComparer("apple", "banana");
            const upper = TyneqComparer.caseInsensitiveComparer("Apple", "Banana");
            expect(Math.sign(lower)).toBe(Math.sign(upper));
        });
    });

    describe("orderBy integration", () => {
        it("sorts mixed-case strings alphabetically ignoring case", () => {
            const result = Tyneq.from(["Banana", "apple", "Cherry"])
                .orderBy((s) => s, TyneqComparer.caseInsensitiveComparer)
                .toArray();
            expect(result).toEqual(["apple", "Banana", "Cherry"]);
        });

        it("sorts all-uppercase strings correctly", () => {
            const result = Tyneq.from(["CHERRY", "APPLE", "BANANA"])
                .orderBy((s) => s, TyneqComparer.caseInsensitiveComparer)
                .toArray();
            expect(result).toEqual(["APPLE", "BANANA", "CHERRY"]);
        });

        it("sorts all-lowercase strings correctly", () => {
            const result = Tyneq.from(["cherry", "apple", "banana"])
                .orderBy((s) => s, TyneqComparer.caseInsensitiveComparer)
                .toArray();
            expect(result).toEqual(["apple", "banana", "cherry"]);
        });

        it("sorts a single-element sequence without error", () => {
            const result = Tyneq.from(["only"])
                .orderBy((s) => s, TyneqComparer.caseInsensitiveComparer)
                .toArray();
            expect(result).toEqual(["only"]);
        });

        it("works with orderByDescending", () => {
            const result = Tyneq.from(["Banana", "apple", "Cherry"])
                .orderByDescending((s) => s, TyneqComparer.caseInsensitiveComparer)
                .toArray();
            expect(result).toEqual(["Cherry", "Banana", "apple"]);
        });

        it("works as a thenBy comparer", () => {
            const input = [
                { group: 1, name: "Banana" },
                { group: 1, name: "apple" },
                { group: 2, name: "Cherry" },
            ];
            const result = Tyneq.from(input)
                .orderBy((x) => x.group)
                .thenBy((x) => x.name, TyneqComparer.caseInsensitiveComparer)
                .toArray();
            expect(result.map((x) => x.name)).toEqual(["apple", "Banana", "Cherry"]);
        });
    });
});
