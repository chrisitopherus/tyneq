import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of iterable) {
    result.push(item);
  }
  return result;
}

describe("toAsync", () => {
  it("yields all elements in order", async () => {
    const result = await collect(Tyneq.from([1, 2, 3]).toAsync());
    expect(result).toEqual([1, 2, 3]);
  });

  it("returns an empty async iterable for an empty source", async () => {
    const result = await collect(Tyneq.from([]).toAsync());
    expect(result).toEqual([]);
  });

  it("is iterable with for-await-of", async () => {
    const collected: number[] = [];
    for await (const item of Tyneq.from([10, 20, 30]).toAsync()) {
      collected.push(item);
    }
    expect(collected).toEqual([10, 20, 30]);
  });

  it("each iteration of the AsyncIterable produces a fresh traversal", async () => {
    const async_ = Tyneq.from([1, 2, 3]).toAsync();
    const first = await collect(async_);
    const second = await collect(async_);
    expect(first).toEqual([1, 2, 3]);
    expect(second).toEqual([1, 2, 3]);
  });

  it("preserves elements after chaining streaming operators", async () => {
    const result = await collect(
      Tyneq.from([1, 2, 3, 4, 5]).where(x => x % 2 === 0).select(x => x * 10).toAsync()
    );
    expect(result).toEqual([20, 40]);
  });

  it("returns a value that satisfies Symbol.asyncIterator", () => {
    const async_ = Tyneq.from([1]).toAsync();
    expect(typeof async_[Symbol.asyncIterator]).toBe("function");
  });
});
