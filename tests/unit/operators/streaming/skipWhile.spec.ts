import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("skipWhile", () => {
  it("skips while predicate is true", () => {
    expect(Tyneq.from([1, 2, 3, 1]).skipWhile((x) => x < 3).toArray()).toEqual([3, 1]);
  });
});
