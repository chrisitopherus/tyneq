import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("lastOrDefault", () => {
  it("returns default when no element matches", () => {
    expect(Tyneq.from([1, 3, 5]).lastOrDefault((x) => x % 2 === 0, 0)).toBe(0);
  });

  it("returns the last matching element", () => {
    expect(Tyneq.from([2, 4, 6]).lastOrDefault((x) => x % 2 === 0, 0)).toBe(6);
  });

  it("returns default for an empty sequence", () => {
    expect(Tyneq.from<number>([]).lastOrDefault((x) => x > 0, -1)).toBe(-1);
  });

  it("passes the zero-based index to the predicate", () => {
    const indices: number[] = [];
    Tyneq.from([1, 2, 3]).lastOrDefault((x, i) => { indices.push(i); return x > 0; }, 0);
    expect(indices).toEqual([0, 1, 2]);
  });

  it("can find last by index", () => {
    expect(Tyneq.from(["a", "b", "c"]).lastOrDefault((_, i) => i < 2, "z")).toBe("b");
  });
});
