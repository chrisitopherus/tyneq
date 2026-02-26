import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("consume", () => {
  it("eagerly iterates the full sequence", () => {
    const seen: number[] = [];

    Tyneq.from([1, 2, 3])
      .tap(x => seen.push(x))
      .consume();

    expect(seen).toEqual([1, 2, 3]);
  });
});
