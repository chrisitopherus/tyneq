import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("skipLast", () => {
  it("skips last N elements", () => {
    expect(Tyneq.from([1, 2, 3, 4]).skipLast(2).toArray()).toEqual([1, 2]);
  });
});
