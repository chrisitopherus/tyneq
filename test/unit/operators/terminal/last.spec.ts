import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("last", () => {
  it("returns last element matching predicate", () => {
    expect(Tyneq.from([1, 2, 3, 4]).last(x => x % 2 === 0)).toBe(4);
  });
});
