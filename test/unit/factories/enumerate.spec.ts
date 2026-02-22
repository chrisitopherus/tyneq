import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../src";

describe("Tyneq.enumerate", () => {
  it("pairs each value with an index", () => {
    expect(Tyneq.enumerate(["a", "b", "c"]).toArray()).toEqual([
      [0, "a"],
      [1, "b"],
      [2, "c"]
    ]);
  });
});
