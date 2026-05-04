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

  it("returns true when the first element is null", () => {
    expect(Tyneq.from<number | null>([null, 1, 2]).isNullOrEmpty()).toBe(true);
  });

  it("returns true when the first element is undefined", () => {
    expect(Tyneq.from<number | undefined>([undefined, 1, 2]).isNullOrEmpty()).toBe(true);
  });

  it("returns false when the sequence starts with 0 (falsy but not null/undefined)", () => {
    expect(Tyneq.from([0, 1, 2]).isNullOrEmpty()).toBe(false);
  });

  it("returns false when the sequence starts with an empty string (falsy but not null/undefined)", () => {
    expect(Tyneq.from(["", "a"]).isNullOrEmpty()).toBe(false);
  });
});
