import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("indexOf", () => {
  it("returns index of first match", () => {
    expect(Tyneq.from([1, 3, 5, 8]).indexOf((x) => x % 2 === 0)).toBe(3);
  });
});
