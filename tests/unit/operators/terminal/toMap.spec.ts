import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("toMap", () => {
  it("creates a map from key value selector", () => {
    const result = Tyneq.from(["a", "bb"]).toMap((x) => ({ key: x, value: x.length }));
    expect(Array.from(result.entries())).toEqual([["a", 1], ["bb", 2]]);
  });

  it("returns empty Map for empty sequence", () => {
    const result = Tyneq.from<string>([]).toMap((x) => ({ key: x, value: x.length }));
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it("maps numeric keys to values", () => {
    const result = Tyneq.from([10, 20, 30]).toMap((x) => ({ key: x, value: x * 2 }));
    expect(result.get(10)).toBe(20);
    expect(result.get(20)).toBe(40);
    expect(result.get(30)).toBe(60);
  });

  it("throws ArgumentNullError when selector is null", () => {
    expect(() => Tyneq.from(["a"]).toMap(null as any)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when selector is undefined", () => {
    expect(() => Tyneq.from(["a"]).toMap(undefined as any)).toThrow(ArgumentError);
  });
});
