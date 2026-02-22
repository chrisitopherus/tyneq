import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("selectMany", () => {
  it("flattens projected iterables", () => {
    expect(Tyneq.from([[1, 2], [3]]).selectMany(x => x).toArray()).toEqual([1, 2, 3]);
  });
});
