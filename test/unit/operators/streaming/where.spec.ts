import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("where", () => {
  it("filters by predicate", () => {
    expect(Tyneq.from([1, 2, 3, 4]).where(x => x % 2 === 0).toArray()).toEqual([2, 4]);
  });
});
