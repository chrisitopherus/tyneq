import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("tap", () => {
  it("runs side effects without changing values", () => {
    const seen: number[] = [];
    const result = Tyneq.from([1, 2, 3]).tap((x) => seen.push(x)).toArray();

    expect(result).toEqual([1, 2, 3]);
    expect(seen).toEqual([1, 2, 3]);
  });

  it("passes the zero-based index to the action", () => {
    const indices: number[] = [];
    Tyneq.from(["a", "b", "c"]).tap((_, i) => indices.push(i)).toArray();
    expect(indices).toEqual([0, 1, 2]);
  });

  it("yields all elements unchanged regardless of action", () => {
    const result = Tyneq.from([10, 20, 30]).tap((x, i) => x + i).toArray();
    expect(result).toEqual([10, 20, 30]);
  });

  it("index resets to 0 on each fresh enumeration", () => {
    const first: number[] = [];
    const second: number[] = [];
    const seq = Tyneq.from(["x", "y"]).tap((_, i) => first.push(i));
    seq.toArray();
    Tyneq.from(["x", "y"]).tap((_, i) => second.push(i)).toArray();
    expect(first).toEqual([0, 1]);
    expect(second).toEqual([0, 1]);
  });
});
