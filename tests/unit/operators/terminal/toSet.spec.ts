import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("toSet", () => {
  it("creates a set from source values", () => {
    expect(Array.from(Tyneq.from([1, 1, 2]).toSet())).toEqual([1, 2]);
  });

  it("returns empty Set for empty sequence", () => {
    const result = Tyneq.from([]).toSet();
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("preserves all unique elements", () => {
    const result = Tyneq.from([1, 2, 3, 4]).toSet();
    expect(result.size).toBe(4);
    expect(result.has(1)).toBe(true);
    expect(result.has(4)).toBe(true);
  });

  it("deduplicates repeated elements", () => {
    const result = Tyneq.from([5, 5, 5, 5]).toSet();
    expect(result.size).toBe(1);
    expect(result.has(5)).toBe(true);
  });
});
