import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("first", () => {
  it("returns first element matching predicate", () => {
    expect(Tyneq.from([1, 3, 4, 6]).first(x => x % 2 === 0)).toBe(4);
  });
});
