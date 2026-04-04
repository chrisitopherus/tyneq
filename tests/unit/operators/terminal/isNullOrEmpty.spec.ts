import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("isNullOrEmpty", () => {
  it("returns true for an empty sequence", () => {
    expect(Tyneq.from<number>([]).isNullOrEmpty()).toBe(true);
  });

  it("returns false for a single-element sequence", () => {
    expect(Tyneq.from([1]).isNullOrEmpty()).toBe(false);
  });

  it("returns false for a multi-element sequence", () => {
    expect(Tyneq.from([1, 2, 3]).isNullOrEmpty()).toBe(false);
  });
});
