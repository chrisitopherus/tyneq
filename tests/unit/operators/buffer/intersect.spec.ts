import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("intersect", () => {
  it("returns distinct shared values", () => {
    expect(Tyneq.from([1, 2, 2, 3, 4]).intersect([2, 3, 3]).toArray()).toEqual([2, 3]);
  });
});
