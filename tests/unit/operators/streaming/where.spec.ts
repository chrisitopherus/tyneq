import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("where", () => {
  it("filters by predicate", () => {
    expect(Tyneq.from([1, 2, 3, 4]).where((x) => x % 2 === 0).toArray()).toEqual([2, 4]);
  });

  it("returns empty sequence when source is empty", () => {
    expect(Tyneq.from<number>([]).where((x) => x > 0).toArray()).toEqual([]);
  });

  it("returns all elements when all match the predicate", () => {
    expect(Tyneq.from([2, 4, 6]).where((x) => x % 2 === 0).toArray()).toEqual([2, 4, 6]);
  });

  it("returns empty sequence when no elements match the predicate", () => {
    expect(Tyneq.from([1, 3, 5]).where((x) => x % 2 === 0).toArray()).toEqual([]);
  });

  it("passes the zero-based index to the predicate", () => {
    const indices: number[] = [];
    Tyneq.from(["a", "b", "c"]).where((_, i) => { indices.push(i); return true; }).toArray();
    expect(indices).toEqual([0, 1, 2]);
  });

  it("index increments for every source item, not just yielded items", () => {
    const indices: number[] = [];
    Tyneq.from([10, 20, 30, 40]).where((x, i) => { indices.push(i); return x > 15; }).toArray();
    expect(indices).toEqual([0, 1, 2, 3]);
  });

  it("can filter by index (keep even-indexed elements)", () => {
    expect(Tyneq.from(["a", "b", "c", "d"]).where((_, i) => i % 2 === 0).toArray()).toEqual(["a", "c"]);
  });

  it("throws when predicate is null and sequence is iterated", () => {
    expect(() => Tyneq.from([1, 2, 3]).where(null as any).toArray()).toThrow();
  });

  it("throws when predicate is undefined and sequence is iterated", () => {
    expect(() => Tyneq.from([1, 2, 3]).where(undefined as any).toArray()).toThrow();
  });
});
