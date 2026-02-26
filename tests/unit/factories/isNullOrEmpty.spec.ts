import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../src";

describe("Tyneq.isNullOrEmpty", () => {
  it("returns true for null and undefined", () => {
    expect(Tyneq.isNullOrEmpty<number>(null)).toBe(true);
    expect(Tyneq.isNullOrEmpty<number>(undefined)).toBe(true);
  });

  it("returns true only when iterable has no elements", () => {
    expect(Tyneq.isNullOrEmpty<number>([])).toBe(true);
    expect(Tyneq.isNullOrEmpty([1])).toBe(false);
  });
});
