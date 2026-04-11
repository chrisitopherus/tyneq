import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("firstOrDefault", () => {
  it("returns default when no matching element exists", () => {
    expect(Tyneq.from([1, 3, 5]).firstOrDefault((x) => x % 2 === 0, 42)).toBe(42);
  });

  it("returns the first matching element", () => {
    expect(Tyneq.from([1, 2, 3]).firstOrDefault((x) => x % 2 === 0, 0)).toBe(2);
  });

  it("returns default for an empty sequence", () => {
    expect(Tyneq.from<number>([]).firstOrDefault((x) => x > 0, -1)).toBe(-1);
  });

  it("passes the zero-based index to the predicate", () => {
    const indices: number[] = [];
    Tyneq.from([1, 2, 3]).firstOrDefault((x, i) => { indices.push(i); return x === 3; }, 0);
    expect(indices).toEqual([0, 1, 2]);
  });

  it("can find by index", () => {
    expect(Tyneq.from(["a", "b", "c"]).firstOrDefault((_, i) => i === 2, "z")).toBe("c");
  });
});
