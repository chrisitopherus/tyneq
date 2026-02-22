import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("distinct", () => {
  it("returns unique values", () => {
    expect(Tyneq.from([1, 1, 2, 3, 2]).distinct().toArray()).toEqual([1, 2, 3]);
  });
});
