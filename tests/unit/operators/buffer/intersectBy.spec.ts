import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("intersectBy", () => {
  it("returns values whose keys are present", () => {
    const result = Tyneq.from(["a", "bb", "ccc", "dd"]).intersectBy([2], x => x.length).toArray();
    expect(result).toEqual(["bb"]);
  });
});
