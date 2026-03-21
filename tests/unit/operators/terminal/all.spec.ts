import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("all", () => {
  it("returns true when all elements match", () => {
    expect(Tyneq.from([2, 4, 6]).all((x) => x % 2 === 0)).toBe(true);
  });

  it("returns false when some elements do not match", () => {
    expect(Tyneq.from([2, 3, 6]).all((x) => x % 2 === 0)).toBe(false);
  });

  it("returns true for empty sequence (vacuous truth)", () => {
    expect(Tyneq.from<number>([]).all((x) => x > 100)).toBe(true);
  });

  it("throws ArgumentNullError when predicate is null", () => {
    expect(() => Tyneq.from([1, 2, 3]).all(null as any)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when predicate is undefined", () => {
    expect(() => Tyneq.from([1, 2, 3]).all(undefined as any)).toThrow(ArgumentError);
  });
});
