import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("skip", () => {
  it("skips first N elements", () => {
    expect(Tyneq.from([1, 2, 3, 4]).skip(2).toArray()).toEqual([3, 4]);
  });
});
