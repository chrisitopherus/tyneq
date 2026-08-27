import { describe, expect, it } from "vitest";
import { Tyneq, InvalidOperationError } from "../../../../src";

describe("intersect", () => {
  it("returns distinct shared values", () => {
    expect(Tyneq.from([1, 2, 2, 3, 4]).intersect([2, 3, 3]).toArray()).toEqual([2, 3]);
  });

  it("throws InvalidOperationError on the second full iteration when intersectedValues is a one-shot generator (F3)", () => {
    function* gen() { yield 2; yield 3; }
    const seq = Tyneq.from([1, 2, 3, 4]).intersect(gen());

    expect(seq.toArray()).toEqual([2, 3]);
    expect(() => seq.toArray()).toThrow(InvalidOperationError);
  });
});
