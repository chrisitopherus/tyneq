import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("toRecord", () => {
  it("creates a record from key value selector", () => {
    const result = Tyneq.from(["a", "bb"]).toRecord(x => ({ key: x, value: x.length }));
    expect(result).toEqual({ a: 1, bb: 2 });
  });

  it("returns empty record for empty sequence", () => {
    const result = Tyneq.from<string>([]).toRecord(x => ({ key: x, value: x.length }));
    expect(result).toEqual({});
  });

  it("maps numeric keys to values", () => {
    const result = Tyneq.from([1, 2, 3]).toRecord(x => ({ key: x, value: x * x }));
    expect(result[1]).toBe(1);
    expect(result[2]).toBe(4);
    expect(result[3]).toBe(9);
  });

  it("throws ArgumentNullError when selector is null", () => {
    expect(() => Tyneq.from(["a"]).toRecord(null as any)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when selector is undefined", () => {
    expect(() => Tyneq.from(["a"]).toRecord(undefined as any)).toThrow(ArgumentError);
  });
});
