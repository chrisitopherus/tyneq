import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("toArray", () => {
  it("materializes sequence as array", () => {
    expect(Tyneq.from(new Set([1, 2, 3])).toArray()).toEqual([1, 2, 3]);
  });

  it("returns empty array for empty sequence", () => {
    expect(Tyneq.from([]).toArray()).toEqual([]);
  });

  it("returns array with single element", () => {
    expect(Tyneq.from([42]).toArray()).toEqual([42]);
  });

  it("preserves element order", () => {
    expect(Tyneq.from([3, 1, 4, 1, 5]).toArray()).toEqual([3, 1, 4, 1, 5]);
  });
});
