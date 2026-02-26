import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("union", () => {
  it("returns distinct union preserving first-seen order", () => {
    expect(Tyneq.from([1, 2, 2]).union([2, 3]).toArray()).toEqual([1, 2, 3]);
  });
});
