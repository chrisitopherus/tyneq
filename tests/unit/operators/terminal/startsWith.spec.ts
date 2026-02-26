import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("startsWith", () => {
  it("returns true when sequence starts with prefix", () => {
    expect(Tyneq.from([1, 2, 3]).startsWith([1, 2])).toBe(true);
  });
});
