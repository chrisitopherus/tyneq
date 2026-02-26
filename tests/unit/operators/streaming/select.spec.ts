import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("select", () => {
  it("projects each element", () => {
    expect(Tyneq.from([1, 2, 3]).select(x => x * x).toArray()).toEqual([1, 4, 9]);
  });
});
