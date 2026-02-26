import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../src";

describe("Tyneq.from", () => {
  it("wraps iterables into re-iterable sequences", () => {
    const source = [1, 2, 3];
    const query = Tyneq.from(source).select(x => x * 2);

    expect(query.toArray()).toEqual([2, 4, 6]);
    expect(query.toArray()).toEqual([2, 4, 6]);
  });
});
