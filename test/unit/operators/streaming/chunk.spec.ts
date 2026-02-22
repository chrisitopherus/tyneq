import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("chunk", () => {
  it("splits into fixed-size chunks", () => {
    expect(Tyneq.from([1, 2, 3, 4, 5]).chunk(2).toArray()).toEqual([[1, 2], [3, 4], [5]]);
  });
});
