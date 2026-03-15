import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentError, ArgumentNullError } from "../../../../src";

describe("distinctBy", () => {
  it("returns unique values by key", () => {
    const result = Tyneq.from(["a", "bb", "cc", "d"]).distinctBy(x => x.length).toArray();
    expect(result).toEqual(["a", "bb"]);
  });

  it("returns all elements when all keys are unique", () => {
    const result = Tyneq.from(["a", "bb", "ccc"]).distinctBy(x => x.length).toArray();
    expect(result).toEqual(["a", "bb", "ccc"]);
  });

  it("returns first element when all keys are identical", () => {
    const result = Tyneq.from(["a", "b", "c"]).distinctBy(x => x.length).toArray();
    expect(result).toEqual(["a"]);
  });

  it("returns empty sequence for empty source", () => {
    const result = Tyneq.from<string>([]).distinctBy(x => x.length).toArray();
    expect(result).toEqual([]);
  });

  it("preserves first-seen order", () => {
    const result = Tyneq.from([3, 1, 4, 1, 5, 9, 2, 6]).distinctBy(x => x % 3).toArray();
    expect(result).toEqual([3, 1, 5]);
  });

  it("re-iterates independently", () => {
    const seq = Tyneq.from(["a", "bb", "c"]).distinctBy(x => x.length);
    expect(seq.toArray()).toEqual(["a", "bb"]);
    expect(seq.toArray()).toEqual(["a", "bb"]);
  });

  it("throws ArgumentNullError when keySelector is null", () => {
    expect(() => Tyneq.from(["a"]).distinctBy(null as any)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when keySelector is undefined", () => {
    expect(() => Tyneq.from(["a"]).distinctBy(undefined as any)).toThrow(ArgumentError);
  });
});
