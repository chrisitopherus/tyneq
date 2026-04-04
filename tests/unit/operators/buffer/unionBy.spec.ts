import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentError, ArgumentNullError } from "../../../../src";

describe("unionBy", () => {
  it("returns union based on key selector", () => {
    const result = Tyneq.from(["a", "bb"]).unionBy(["cc", "ddd"], (x) => x.length).toArray();
    expect(result).toEqual(["a", "bb", "ddd"]);
  });

  it("yields source elements first, then non-duplicate other elements", () => {
    const result = Tyneq.from(["bb"]).unionBy(["a", "cc"], (x) => x.length).toArray();
    expect(result).toEqual(["bb", "a"]);
  });

  it("returns all source elements when other is empty", () => {
    const result = Tyneq.from(["a", "bb"]).unionBy([], (x) => x.length).toArray();
    expect(result).toEqual(["a", "bb"]);
  });

  it("returns all other elements when source is empty", () => {
    const result = Tyneq.from<string>([]).unionBy(["a", "bb"], (x) => x.length).toArray();
    expect(result).toEqual(["a", "bb"]);
  });

  it("returns empty sequence when both source and other are empty", () => {
    const result = Tyneq.from<string>([]).unionBy([], (x) => x.length).toArray();
    expect(result).toEqual([]);
  });

  it("deduplicates within the source itself", () => {
    const result = Tyneq.from(["a", "b", "cc"]).unionBy(["ddd"], (x) => x.length).toArray();
    expect(result).toEqual(["a", "cc", "ddd"]);
  });

  it("re-iterates independently", () => {
    const seq = Tyneq.from(["a"]).unionBy(["bb"], (x) => x.length);
    expect(seq.toArray()).toEqual(["a", "bb"]);
    expect(seq.toArray()).toEqual(["a", "bb"]);
  });

  it("throws ArgumentNullError when otherValues is null", () => {
    expect(() => Tyneq.from(["a"]).unionBy(null as any, (x) => x.length)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when otherValues is undefined", () => {
    expect(() => Tyneq.from(["a"]).unionBy(undefined as any, (x) => x.length)).toThrow(ArgumentError);
  });

  it("throws ArgumentNullError when keySelector is null", () => {
    expect(() => Tyneq.from(["a"]).unionBy([], null as any)).toThrow(ArgumentNullError);
  });
});
