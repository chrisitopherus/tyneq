import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../src";

describe("Tyneq.range", () => {
  it("creates a contiguous integer sequence", () => {
    expect(Tyneq.range(3, 4).toArray()).toEqual([3, 4, 5, 6]);
  });
});
