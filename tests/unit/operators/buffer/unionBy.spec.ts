import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("unionBy", () => {
  it("returns union based on key selector", () => {
    const result = Tyneq.from(["a", "bb"]).unionBy(["cc", "ddd"], x => x.length).toArray();
    expect(result).toEqual(["a", "bb", "ddd"]);
  });
});
