import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("distinctBy", () => {
  it("returns unique values by key", () => {
    const result = Tyneq.from(["a", "bb", "cc", "d"]).distinctBy(x => x.length).toArray();
    expect(result).toEqual(["a", "bb"]);
  });
});
