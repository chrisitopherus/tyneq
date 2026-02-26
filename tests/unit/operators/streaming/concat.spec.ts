import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("concat", () => {
  it("concatenates two sequences", () => {
    expect(Tyneq.from([1, 2]).concat([3, 4]).toArray()).toEqual([1, 2, 3, 4]);
  });
});
