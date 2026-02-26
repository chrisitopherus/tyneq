import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("all", () => {
  it("returns true when all elements match", () => {
    expect(Tyneq.from([2, 4, 6]).all(x => x % 2 === 0)).toBe(true);
  });
});
