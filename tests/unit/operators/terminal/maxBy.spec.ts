import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("maxBy", () => {
  it("returns element with maximum key", () => {
    const result = Tyneq.from([{ n: "a" }, { n: "alphabet" }, { n: "cat" }]).maxBy((x) => x.n.length);
    expect(result).toEqual({ n: "alphabet" });
  });
});
