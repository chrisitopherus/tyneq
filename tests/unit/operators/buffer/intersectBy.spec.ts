import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentError, ArgumentNullError, InvalidOperationError } from "../../../../src";

describe("intersectBy", () => {
  it("returns values whose keys are present", () => {
    const result = Tyneq.from(["a", "bb", "ccc", "dd"]).intersectBy([2], (x) => x.length).toArray();
    expect(result).toEqual(["bb"]);
  });

  it("returns empty sequence when no keys intersect", () => {
    const result = Tyneq.from(["a", "bb"]).intersectBy([3], (x) => x.length).toArray();
    expect(result).toEqual([]);
  });

  it("returns empty sequence when other keys set is empty", () => {
    const result = Tyneq.from(["a", "bb"]).intersectBy([], (x) => x.length).toArray();
    expect(result).toEqual([]);
  });

  it("returns empty sequence for empty source", () => {
    const result = Tyneq.from<string>([]).intersectBy([1], (x) => x.length).toArray();
    expect(result).toEqual([]);
  });

  it("deduplicates: only first element per key is yielded", () => {
    const result = Tyneq.from(["a", "b", "cc", "dd"]).intersectBy([1, 2], (x) => x.length).toArray();
    expect(result).toEqual(["a", "cc"]);
  });

  it("re-iterates independently", () => {
    const seq = Tyneq.from(["a", "bb", "ccc"]).intersectBy([1, 3], (x) => x.length);
    expect(seq.toArray()).toEqual(["a", "ccc"]);
    expect(seq.toArray()).toEqual(["a", "ccc"]);
  });

  it("throws ArgumentNullError when otherValues is null", () => {
    expect(() => Tyneq.from(["a"]).intersectBy(null as any, (x) => x.length)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when otherValues is undefined", () => {
    expect(() => Tyneq.from(["a"]).intersectBy(undefined as any, (x) => x.length)).toThrow(ArgumentError);
  });

  it("throws ArgumentNullError when keySelector is null", () => {
    expect(() => Tyneq.from(["a"]).intersectBy([], null as any)).toThrow(ArgumentNullError);
  });

  it("throws InvalidOperationError on the second full iteration when intersectedKeys is a one-shot generator (F3)", () => {
    function* gen() { yield 2; }
    const seq = Tyneq.from(["a", "bb", "ccc", "dd"]).intersectBy(gen(), (x) => x.length);

    expect(seq.toArray()).toEqual(["bb"]);
    expect(() => seq.toArray()).toThrow(InvalidOperationError);
  });
});
