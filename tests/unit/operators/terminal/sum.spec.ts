import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("sum", () => {
  it("sums projected values", () => {
    expect(Tyneq.from([{ v: 2 }, { v: 3 }]).sum(x => x.v)).toBe(5);
  });
});
