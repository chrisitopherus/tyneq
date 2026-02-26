import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("toMap", () => {
  it("creates a map from key value selector", () => {
    const result = Tyneq.from(["a", "bb"]).toMap(x => ({ key: x, value: x.length }));
    expect(Array.from(result.entries())).toEqual([["a", 1], ["bb", 2]]);
  });
});
