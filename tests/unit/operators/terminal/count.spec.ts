import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("count", () => {
  it("counts all elements", () => {
    expect(Tyneq.from([1, 2, 3, 4]).count()).toBe(4);
  });
});
