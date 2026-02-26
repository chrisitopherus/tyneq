import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("isNullOrEmpty", () => {
  it("returns true only for empty sequences", () => {
    expect(Tyneq.from<number>([]).isNullOrEmpty()).toBe(true);
    expect(Tyneq.from([1]).isNullOrEmpty()).toBe(false);
  });
});
