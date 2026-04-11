import { describe, expect, it } from "vitest";
import { Tyneq, InvalidOperationError, ArgumentNullError, ArgumentError } from "../../../../src";

describe("single", () => {
  it("returns the only matching element", () => {
    expect(Tyneq.from([1, 2, 3]).single((x) => x === 2)).toBe(2);
  });

  it("throws InvalidOperationError when no element matches", () => {
    expect(() => Tyneq.from([1, 3, 5]).single((x) => x === 2)).toThrow(InvalidOperationError);
  });

  it("throws InvalidOperationError when more than one element matches", () => {
    expect(() => Tyneq.from([2, 4, 6]).single((x) => x % 2 === 0)).toThrow(InvalidOperationError);
  });

  it("throws InvalidOperationError for empty sequence", () => {
    expect(() => Tyneq.from<number>([]).single((x) => x > 0)).toThrow(InvalidOperationError);
  });

  it("passes the zero-based index to the predicate", () => {
    const indices: number[] = [];
    Tyneq.from([1, 2, 3]).single((x, i) => { indices.push(i); return x === 3; });
    expect(indices).toEqual([0, 1, 2]);
  });

  it("can find single by index", () => {
    expect(Tyneq.from(["a", "b", "c"]).single((_, i) => i === 1)).toBe("b");
  });

  it("throws ArgumentNullError when predicate is null", () => {
    expect(() => Tyneq.from([1]).single(null as any)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when predicate is undefined", () => {
    expect(() => Tyneq.from([1]).single(undefined as any)).toThrow(ArgumentError);
  });
});
