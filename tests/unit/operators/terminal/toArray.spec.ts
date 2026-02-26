import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("toArray", () => {
  it("materializes sequence as array", () => {
    expect(Tyneq.from(new Set([1, 2, 3])).toArray()).toEqual([1, 2, 3]);
  });
});
