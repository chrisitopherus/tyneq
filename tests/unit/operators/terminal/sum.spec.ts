import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("sum", () => {
  it("sums projected values", () => {
    expect(Tyneq.from([{ v: 2 }, { v: 3 }]).sum((x) => x.v)).toBe(5);
  });

  it("returns 0 for empty sequence", () => {
    expect(Tyneq.from<number>([]).sum((x) => x)).toBe(0);
  });

  it("sums a single element", () => {
    expect(Tyneq.from([7]).sum((x) => x)).toBe(7);
  });

  it("sums multiple integers", () => {
    expect(Tyneq.from([1, 2, 3, 4, 5]).sum((x) => x)).toBe(15);
  });

  it("sums floating point numbers", () => {
    expect(Tyneq.from([1.1, 2.2, 3.3]).sum((x) => x)).toBeCloseTo(6.6);
  });

  it("throws ArgumentNullError when selector is null", () => {
    expect(() => Tyneq.from([1, 2, 3]).sum(null as any)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when selector is undefined", () => {
    expect(() => Tyneq.from([1, 2, 3]).sum(undefined as any)).toThrow(ArgumentError);
  });
});
