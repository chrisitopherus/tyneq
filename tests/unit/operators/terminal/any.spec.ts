import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("any", () => {
  it("returns true when any element matches", () => {
    expect(Tyneq.from([1, 2, 3]).any((x) => x > 2)).toBe(true);
  });

  it("returns true when predicate is true for some elements", () => {
    expect(Tyneq.from([1, 2, 3, 4]).any((x) => x % 2 === 0)).toBe(true);
  });

  it("returns false when predicate is false for all elements", () => {
    expect(Tyneq.from([1, 3, 5]).any((x) => x % 2 === 0)).toBe(false);
  });

  it("returns false for empty sequence", () => {
    expect(Tyneq.from<number>([]).any((x) => x > 0)).toBe(false);
  });

  it("passes the zero-based index to the predicate", () => {
    const indices: number[] = [];
    Tyneq.from(["a", "b", "c"]).any((_, i) => { indices.push(i); return false; });
    expect(indices).toEqual([0, 1, 2]);
  });

  it("can test by index", () => {
    expect(Tyneq.from([10, 20, 30]).any((_, i) => i === 2)).toBe(true);
  });

  it("throws ArgumentNullError when predicate is null", () => {
    expect(() => Tyneq.from([1, 2, 3]).any(null as any)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when predicate is undefined", () => {
    expect(() => Tyneq.from([1, 2, 3]).any(undefined as any)).toThrow(ArgumentError);
  });
});
