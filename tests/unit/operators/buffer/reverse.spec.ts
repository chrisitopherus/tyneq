import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("reverse", () => {
  it("reverses sequence order", () => {
    expect(Tyneq.from([1, 2, 3]).reverse().toArray()).toEqual([3, 2, 1]);
  });
});
