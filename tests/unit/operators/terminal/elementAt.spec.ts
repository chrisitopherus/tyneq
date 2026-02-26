import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("elementAt", () => {
  it("returns the element at the specified index", () => {
    expect(Tyneq.from([10, 20, 30]).elementAt(1)).toBe(20);
  });
});
