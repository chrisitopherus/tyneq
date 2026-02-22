import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("minBy", () => {
  it("returns element with minimum key", () => {
    const result = Tyneq.from([{ n: "alpha" }, { n: "b" }, { n: "cat" }]).minBy(x => x.n.length);
    expect(result).toEqual({ n: "b" });
  });
});
