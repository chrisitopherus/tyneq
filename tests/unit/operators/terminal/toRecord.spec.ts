import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("toRecord", () => {
  it("creates a record from key value selector", () => {
    const result = Tyneq.from(["a", "bb"]).toRecord(x => ({ key: x, value: x.length }));
    expect(result).toEqual({ a: 1, bb: 2 });
  });
});
