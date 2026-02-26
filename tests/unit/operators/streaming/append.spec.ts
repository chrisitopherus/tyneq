import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("append", () => {
  it("appends an element to the end", () => {
    expect(Tyneq.from([1, 2]).append(3).toArray()).toEqual([1, 2, 3]);
  });
});
