import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("exceptBy", () => {
  it("returns values whose keys are not excluded", () => {
    const result = Tyneq.from(["a", "bb", "ccc"]).exceptBy([1, 3], x => x.length).toArray();
    expect(result).toEqual(["bb"]);
  });
});
