import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("min", () => {
  it("returns minimum element", () => {
    expect(Tyneq.from([3, 10, 7]).min()).toBe(3);
  });
});
