import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("except", () => {
  it("returns values not in excluded set", () => {
    expect(Tyneq.from([1, 2, 3, 4]).except([2, 4]).toArray()).toEqual([1, 3]);
  });
});
