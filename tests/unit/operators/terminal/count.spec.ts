import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("count", () => {
  it("counts all elements", () => {
    expect(Tyneq.from([1, 2, 3, 4]).count()).toBe(4);
  });

  it("returns 0 for empty sequence", () => {
    expect(Tyneq.from([]).count()).toBe(0);
  });

  it("returns 1 for single element", () => {
    expect(Tyneq.from([42]).count()).toBe(1);
  });

  it("counts elements in a non-array iterable", () => {
    expect(Tyneq.from(new Set([1, 2, 3])).count()).toBe(3);
  });
});
