import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("skipWhile", () => {
  it("skips while predicate is true", () => {
    expect(Tyneq.from([1, 2, 3, 1]).skipWhile((x) => x < 3).toArray()).toEqual([3, 1]);
  });

  it("returns empty when all elements are skipped", () => {
    expect(Tyneq.from([1, 2, 3]).skipWhile((x) => x < 10).toArray()).toEqual([]);
  });

  it("returns all elements when predicate is false for first element", () => {
    expect(Tyneq.from([5, 1, 2]).skipWhile((x) => x < 3).toArray()).toEqual([5, 1, 2]);
  });

  it("passes the zero-based index to the predicate", () => {
    const indices: number[] = [];
    Tyneq.from(["a", "b", "c"]).skipWhile((_, i) => { indices.push(i); return true; }).toArray();
    expect(indices).toEqual([0, 1, 2]);
  });

  it("can skip by index (skip first two elements)", () => {
    expect(Tyneq.from([10, 20, 30, 40]).skipWhile((_, i) => i < 2).toArray()).toEqual([30, 40]);
  });

  it("index increments for every source item including skipped ones", () => {
    const indices: number[] = [];
    Tyneq.from([1, 2, 3, 4]).skipWhile((x, i) => { indices.push(i); return x < 3; }).toArray();
    expect(indices).toEqual([0, 1, 2]);
  });
});
