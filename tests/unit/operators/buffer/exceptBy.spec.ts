import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentError, ArgumentNullError } from "../../../../src";

describe("exceptBy", () => {
  it("returns values whose keys are not excluded", () => {
    const result = Tyneq.from(["a", "bb", "ccc"]).exceptBy([1, 3], x => x.length).toArray();
    expect(result).toEqual(["bb"]);
  });

  it("returns all elements when excluded keys set is empty", () => {
    const result = Tyneq.from(["a", "bb"]).exceptBy([], x => x.length).toArray();
    expect(result).toEqual(["a", "bb"]);
  });

  it("returns empty sequence when all keys are excluded", () => {
    const result = Tyneq.from(["a", "bb"]).exceptBy([1, 2], x => x.length).toArray();
    expect(result).toEqual([]);
  });

  it("returns empty sequence for empty source", () => {
    const result = Tyneq.from<string>([]).exceptBy([1], x => x.length).toArray();
    expect(result).toEqual([]);
  });

  it("deduplicates: only first element per key is yielded", () => {
    const result = Tyneq.from(["a", "b", "cc"]).exceptBy([], x => x.length).toArray();
    expect(result).toEqual(["a", "cc"]);
  });

  it("re-iterates independently", () => {
    const seq = Tyneq.from(["a", "bb", "ccc"]).exceptBy([3], x => x.length);
    expect(seq.toArray()).toEqual(["a", "bb"]);
    expect(seq.toArray()).toEqual(["a", "bb"]);
  });

  it("throws ArgumentNullError when excludedKeys is null", () => {
    expect(() => Tyneq.from(["a"]).exceptBy(null as any, x => x.length)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when excludedKeys is undefined", () => {
    expect(() => Tyneq.from(["a"]).exceptBy(undefined as any, x => x.length)).toThrow(ArgumentError);
  });

  it("throws ArgumentNullError when keySelector is null", () => {
    expect(() => Tyneq.from(["a"]).exceptBy([], null as any)).toThrow(ArgumentNullError);
  });
});
