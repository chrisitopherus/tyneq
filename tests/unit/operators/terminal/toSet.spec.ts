import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("toSet", () => {
  it("creates a set from source values", () => {
    expect(Array.from(Tyneq.from([1, 1, 2]).toSet())).toEqual([1, 2]);
  });
});
