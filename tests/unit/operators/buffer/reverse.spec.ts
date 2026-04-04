import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("reverse", () => {
  it("reverses sequence order", () => {
    expect(Tyneq.from([1, 2, 3]).reverse().toArray()).toEqual([3, 2, 1]);
  });

  it("returns empty sequence for empty input", () => {
    expect(Tyneq.from([]).reverse().toArray()).toEqual([]);
  });

  it("returns same single-element sequence", () => {
    expect(Tyneq.from([42]).reverse().toArray()).toEqual([42]);
  });

  it("verifies exact reverse order for longer sequence", () => {
    const input = [10, 20, 30, 40, 50];
    const result = Tyneq.from(input).reverse().toArray();
    expect(result).toEqual([50, 40, 30, 20, 10]);
  });

  it("reversing twice yields original order", () => {
    const input = [1, 2, 3, 4, 5];
    expect(Tyneq.from(input).reverse().reverse().toArray()).toEqual(input);
  });
});
