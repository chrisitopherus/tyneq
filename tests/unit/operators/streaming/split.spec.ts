import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("split", () => {
  it("splits on delimiter predicate and excludes delimiters", () => {
    expect(Tyneq.from([1, 0, 2, 3, 0, 4]).split((x) => x === 0).toArray()).toEqual([[1], [2, 3], [4]]);
  });
});
