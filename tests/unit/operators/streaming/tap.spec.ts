import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("tap", () => {
  it("runs side effects without changing values", () => {
    const seen: number[] = [];
    const result = Tyneq.from([1, 2, 3]).tap(x => seen.push(x)).toArray();

    expect(result).toEqual([1, 2, 3]);
    expect(seen).toEqual([1, 2, 3]);
  });
});
