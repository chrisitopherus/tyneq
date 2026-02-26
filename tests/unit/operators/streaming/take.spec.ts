import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("take", () => {
  it("takes first N elements", () => {
    expect(Tyneq.from([1, 2, 3, 4]).take(2).toArray()).toEqual([1, 2]);
  });
});
