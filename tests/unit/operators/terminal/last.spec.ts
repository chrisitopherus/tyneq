import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError, InvalidOperationError } from "../../../../src";

describe("last", () => {
  it("returns last element matching predicate", () => {
    expect(Tyneq.from([1, 2, 3, 4]).last((x) => x % 2 === 0)).toBe(4);
  });

  it("returns the last matching element when multiple match", () => {
    expect(Tyneq.from([2, 4, 6]).last((x) => x % 2 === 0)).toBe(6);
  });

  it("throws InvalidOperationError when no element matches the predicate", () => {
    expect(() => Tyneq.from([1, 3, 5]).last((x) => x % 2 === 0)).toThrow(InvalidOperationError);
  });

  it("throws InvalidOperationError for empty sequence", () => {
    expect(() => Tyneq.from<number>([]).last((x) => x > 0)).toThrow(InvalidOperationError);
  });

  it("passes the zero-based index to the predicate", () => {
    const indices: number[] = [];
    Tyneq.from([1, 2, 3]).last((x, i) => { indices.push(i); return x % 2 !== 0; });
    expect(indices).toEqual([0, 1, 2]);
  });

  it("can find last by index", () => {
    expect(Tyneq.from(["a", "b", "c"]).last((_, i) => i < 2)).toBe("b");
  });

  it("throws ArgumentNullError when predicate is null", () => {
    expect(() => Tyneq.from([1, 2, 3]).last(null as any)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when predicate is undefined", () => {
    expect(() => Tyneq.from([1, 2, 3]).last(undefined as any)).toThrow(ArgumentError);
  });
});
