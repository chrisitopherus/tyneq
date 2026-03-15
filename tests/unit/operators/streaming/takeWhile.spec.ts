import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("takeWhile", () => {
  it("takes while predicate is true", () => {
    expect(Tyneq.from([1, 2, 3, 1]).takeWhile((x) => x < 3).toArray()).toEqual([1, 2]);
  });
});
