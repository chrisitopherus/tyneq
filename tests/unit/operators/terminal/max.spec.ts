import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("max", () => {
  it("returns maximum element", () => {
    expect(Tyneq.from([3, 10, 7]).max()).toBe(10);
  });
});
