import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("countBy", () => {
  it("counts elements matching a predicate", () => {
    expect(Tyneq.from([1, 2, 3, 4, 5]).countBy(x => x % 2 === 0)).toBe(2);
  });
});
