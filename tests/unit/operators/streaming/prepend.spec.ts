import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("prepend", () => {
  it("prepends an element to the start", () => {
    expect(Tyneq.from([2, 3]).prepend(1).toArray()).toEqual([1, 2, 3]);
  });
});
