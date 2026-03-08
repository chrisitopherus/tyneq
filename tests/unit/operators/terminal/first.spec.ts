import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError, InvalidOperationError } from "../../../../src";

describe("first", () => {
  it("returns first element matching predicate", () => {
    expect(Tyneq.from([1, 3, 4, 6]).first(x => x % 2 === 0)).toBe(4);
  });

  it("returns the first matching element when multiple match", () => {
    expect(Tyneq.from([2, 4, 6]).first(x => x % 2 === 0)).toBe(2);
  });

  it("throws InvalidOperationError when no element matches the predicate", () => {
    expect(() => Tyneq.from([1, 3, 5]).first(x => x % 2 === 0)).toThrow(InvalidOperationError);
  });

  it("throws InvalidOperationError for empty sequence", () => {
    expect(() => Tyneq.from<number>([]).first(x => x > 0)).toThrow(InvalidOperationError);
  });

  it("throws ArgumentNullError when predicate is null", () => {
    expect(() => Tyneq.from([1, 2, 3]).first(null as any)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when predicate is undefined", () => {
    expect(() => Tyneq.from([1, 2, 3]).first(undefined as any)).toThrow(ArgumentError);
  });
});
