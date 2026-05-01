import { describe, expect, it } from "vitest";
import { TyneqComparer } from "../../../src";

// ============================================================
// defaultComparer
// ============================================================

describe("TyneqComparer.defaultComparer", () => {
    describe("numbers", () => {
        it("returns negative when a < b", () => {
            expect(TyneqComparer.defaultComparer(1, 2)).toBeLessThan(0);
        });

        it("returns positive when a > b", () => {
            expect(TyneqComparer.defaultComparer(2, 1)).toBeGreaterThan(0);
        });

        it("returns 0 when a === b", () => {
            expect(TyneqComparer.defaultComparer(5, 5)).toBe(0);
        });

        it("returns 0 for 0 === 0", () => {
            expect(TyneqComparer.defaultComparer(0, 0)).toBe(0);
        });

        it("handles negative numbers", () => {
            expect(TyneqComparer.defaultComparer(-3, -1)).toBeLessThan(0);
            expect(TyneqComparer.defaultComparer(-1, -3)).toBeGreaterThan(0);
        });
    });

    describe("strings", () => {
        it("returns negative when a sorts before b lexicographically", () => {
            expect(TyneqComparer.defaultComparer("apple", "banana")).toBeLessThan(0);
        });

        it("returns positive when a sorts after b lexicographically", () => {
            expect(TyneqComparer.defaultComparer("banana", "apple")).toBeGreaterThan(0);
        });

        it("returns 0 for identical strings", () => {
            expect(TyneqComparer.defaultComparer("abc", "abc")).toBe(0);
        });

        it("returns 0 for empty strings", () => {
            expect(TyneqComparer.defaultComparer("", "")).toBe(0);
        });
    });

    describe("contract", () => {
        it("is anti-symmetric: sign(compare(a,b)) === -sign(compare(b,a))", () => {
            const ab = TyneqComparer.defaultComparer(1, 2);
            const ba = TyneqComparer.defaultComparer(2, 1);
            expect(Math.sign(ab)).toBe(-Math.sign(ba));
        });

        it("returns negative or positive values according to ordering", () => {
            expect(TyneqComparer.defaultComparer(1, 2)).toBeLessThan(0);
            expect(TyneqComparer.defaultComparer(2, 1)).toBeGreaterThan(0);
        });
    });
});

// ============================================================
// defaultEqualityComparer
// ============================================================

describe("TyneqComparer.defaultEqualityComparer", () => {
    it("returns true for equal numbers", () => {
        expect(TyneqComparer.defaultEqualityComparer(1, 1)).toBe(true);
    });

    it("returns false for unequal numbers", () => {
        expect(TyneqComparer.defaultEqualityComparer(1, 2)).toBe(false);
    });

    it("returns true for equal strings", () => {
        expect(TyneqComparer.defaultEqualityComparer("a", "a")).toBe(true);
    });

    it("returns false for strings that differ only in case", () => {
        expect(TyneqComparer.defaultEqualityComparer("a", "A")).toBe(false);
    });

    it("returns true for the same object reference", () => {
        const obj = { id: 1 };
        expect(TyneqComparer.defaultEqualityComparer(obj, obj)).toBe(true);
    });

    it("returns false for distinct object references with same shape", () => {
        expect(TyneqComparer.defaultEqualityComparer({ id: 1 }, { id: 1 })).toBe(false);
    });

    it("returns true for null === null", () => {
        expect(TyneqComparer.defaultEqualityComparer(null, null)).toBe(true);
    });

    it("returns false for null !== undefined", () => {
        expect(TyneqComparer.defaultEqualityComparer(null as any, undefined as any)).toBe(false);
    });
});

// ============================================================
// reverse
// ============================================================

describe("TyneqComparer.reverse", () => {
    it("inverts a negative result to positive", () => {
        const reversed = TyneqComparer.reverse(TyneqComparer.defaultComparer);
        expect(reversed(1, 2)).toBeGreaterThan(0);
    });

    it("inverts a positive result to negative", () => {
        const reversed = TyneqComparer.reverse(TyneqComparer.defaultComparer);
        expect(reversed(2, 1)).toBeLessThan(0);
    });

    it("preserves 0 for equal values", () => {
        const reversed = TyneqComparer.reverse(TyneqComparer.defaultComparer);
        expect(reversed(5, 5)).toBe(0);
    });

    it("reversing twice restores the original order", () => {
        const original = TyneqComparer.defaultComparer;
        const double = TyneqComparer.reverse(TyneqComparer.reverse(original));
        expect(Math.sign(double(1, 2))).toBe(Math.sign(original(1, 2)));
        expect(Math.sign(double(2, 1))).toBe(Math.sign(original(2, 1)));
    });

    it("works with a custom comparer", () => {
        const byLength: (a: string, b: string) => number = (a, b) => a.length - b.length;
        const reversed = TyneqComparer.reverse(byLength);
        expect(reversed("ab", "a")).toBeLessThan(0);
        expect(reversed("a", "ab")).toBeGreaterThan(0);
    });
});

// ============================================================
// createLocaleComparer
// ============================================================

describe("TyneqComparer.createLocaleComparer", () => {
    it("returns a function", () => {
        expect(typeof TyneqComparer.createLocaleComparer()).toBe("function");
    });

    it("the returned comparer returns 0 for identical strings", () => {
        const cmp = TyneqComparer.createLocaleComparer("en");
        expect(cmp("apple", "apple")).toBe(0);
    });

    it("the returned comparer returns negative when a sorts before b", () => {
        const cmp = TyneqComparer.createLocaleComparer("en");
        expect(cmp("apple", "banana")).toBeLessThan(0);
    });

    it("the returned comparer returns positive when a sorts after b", () => {
        const cmp = TyneqComparer.createLocaleComparer("en");
        expect(cmp("banana", "apple")).toBeGreaterThan(0);
    });

    it("is anti-symmetric", () => {
        const cmp = TyneqComparer.createLocaleComparer("en");
        expect(Math.sign(cmp("apple", "banana"))).toBe(-Math.sign(cmp("banana", "apple")));
    });

    it("respects sensitivity option: base makes case-insensitive", () => {
        const cmp = TyneqComparer.createLocaleComparer(undefined, { sensitivity: "base" });
        expect(cmp("Apple", "apple")).toBe(0);
    });

    it("each call returns an independent comparer", () => {
        const a = TyneqComparer.createLocaleComparer("en");
        const b = TyneqComparer.createLocaleComparer("en");
        expect(a).not.toBe(b);
    });
});

// ============================================================
// caseInsensitiveEqualityComparer
// ============================================================

describe("TyneqComparer.caseInsensitiveEqualityComparer", () => {
    it("returns true for identical strings", () => {
        expect(TyneqComparer.caseInsensitiveEqualityComparer("apple", "apple")).toBe(true);
    });

    it("returns true when strings differ only in case", () => {
        expect(TyneqComparer.caseInsensitiveEqualityComparer("apple", "Apple")).toBe(true);
        expect(TyneqComparer.caseInsensitiveEqualityComparer("APPLE", "apple")).toBe(true);
    });

    it("returns true for empty strings", () => {
        expect(TyneqComparer.caseInsensitiveEqualityComparer("", "")).toBe(true);
    });

    it("returns false for different strings", () => {
        expect(TyneqComparer.caseInsensitiveEqualityComparer("apple", "banana")).toBe(false);
    });

    it("returns false for strings that differ beyond case", () => {
        expect(TyneqComparer.caseInsensitiveEqualityComparer("apple", "apples")).toBe(false);
    });

    it("is consistent with caseInsensitiveComparer: equal strings produce 0", () => {
        const pairs = [["apple", "Apple"], ["HELLO", "hello"], ["", ""]];
        for (const [a, b] of pairs) {
            const eqResult = TyneqComparer.caseInsensitiveEqualityComparer(a, b);
            const cmpResult = TyneqComparer.caseInsensitiveComparer(a, b);
            expect(eqResult).toBe(true);
            expect(cmpResult).toBe(0);
        }
    });

    it("is consistent with caseInsensitiveComparer: unequal strings produce non-zero", () => {
        const eqResult = TyneqComparer.caseInsensitiveEqualityComparer("apple", "banana");
        const cmpResult = TyneqComparer.caseInsensitiveComparer("apple", "banana");
        expect(eqResult).toBe(false);
        expect(cmpResult).not.toBe(0);
    });
});
