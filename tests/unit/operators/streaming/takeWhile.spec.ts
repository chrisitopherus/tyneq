import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("takeWhile", () => {
  it("takes while predicate is true", () => {
    expect(Tyneq.from([1, 2, 3, 1]).takeWhile((x) => x < 3).toArray()).toEqual([1, 2]);
  });

  it("returns all elements when predicate is always true", () => {
    expect(Tyneq.from([1, 2, 3]).takeWhile((x) => x < 10).toArray()).toEqual([1, 2, 3]);
  });

  it("returns empty when predicate is false for first element", () => {
    expect(Tyneq.from([5, 1, 2]).takeWhile((x) => x < 3).toArray()).toEqual([]);
  });

  it("returns empty for empty source", () => {
    expect(Tyneq.from<number>([]).takeWhile((x) => x < 3).toArray()).toEqual([]);
  });

  it("passes the zero-based index to the predicate", () => {
    const indices: number[] = [];
    Tyneq.from(["a", "b", "c"]).takeWhile((_, i) => { indices.push(i); return true; }).toArray();
    expect(indices).toEqual([0, 1, 2]);
  });

  it("can take by index (take only first two elements)", () => {
    expect(Tyneq.from([10, 20, 30, 40]).takeWhile((_, i) => i < 2).toArray()).toEqual([10, 20]);
  });

  it("stops checking the predicate after the first false", () => {
    const indices: number[] = [];
    Tyneq.from([1, 2, 3, 4]).takeWhile((x, i) => { indices.push(i); return x < 3; }).toArray();
    expect(indices).toEqual([0, 1, 2]);
  });

  it("index resets to 0 on each fresh enumeration", () => {
    const seq = Tyneq.from([1, 2, 3]).takeWhile((_, i) => i < 2);
    expect(seq.toArray()).toEqual([1, 2]);
    expect(seq.toArray()).toEqual([1, 2]);
  });
});
