import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("throttle", () => {
  it("keeps every Nth element starting from the first", () => {
    expect(Tyneq.from([1, 2, 3, 4, 5, 6]).throttle(2).toArray()).toEqual([1, 3, 5]);
  });
});
