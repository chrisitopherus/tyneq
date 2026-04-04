import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("chunk", () => {
  it("splits into fixed-size chunks", () => {
    expect(Tyneq.from([1, 2, 3, 4, 5]).chunk(2).toArray()).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("last chunk is smaller when sequence length is not evenly divisible", () => {
    const result = Tyneq.from([1, 2, 3, 4, 5, 6, 7]).chunk(3).toArray();
    expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    expect(result[result.length - 1].length).toBe(1);
  });

  it("returns empty sequence when source is empty", () => {
    expect(Tyneq.from([]).chunk(2).toArray()).toEqual([]);
  });

  it("places each element in its own array when chunk size is 1", () => {
    expect(Tyneq.from([1, 2, 3]).chunk(1).toArray()).toEqual([[1], [2], [3]]);
  });

  it("produces a single chunk when chunk size equals sequence length", () => {
    expect(Tyneq.from([1, 2, 3]).chunk(3).toArray()).toEqual([[1, 2, 3]]);
  });

  it("produces a single chunk when chunk size exceeds sequence length", () => {
    expect(Tyneq.from([1, 2]).chunk(10).toArray()).toEqual([[1, 2]]);
  });
});
