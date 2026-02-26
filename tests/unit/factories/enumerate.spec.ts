import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../src";

describe("Tyneq.enumerate", () => {
  it("pairs each value with an index", () => {
    const expected = [
      [0, "a"],
      [1, "b"],
      [2, "c"]
    ];
    const result = [];

    for (const pair of Tyneq.enumerate(["a", "b", "c"])) {
      result.push(pair);
    }

    expect(result).toEqual(expected);
  });
});
