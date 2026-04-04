import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

const isString = (x: unknown): x is string => typeof x === "string";
const isNumber = (x: unknown): x is number => typeof x === "number";

describe("ofType", () => {
  it("yields only elements that satisfy the type guard", () => {
    const mixed: (string | number)[] = [1, "a", 2, "b", 3];
    const result = Tyneq.from(mixed).ofType(isString).toArray();
    expect(result).toEqual(["a", "b"]);
  });

  it("returns empty sequence when no elements match the guard", () => {
    const result = Tyneq.from([1, 2, 3]).ofType(isString as any).toArray();
    expect(result).toEqual([]);
  });

  it("returns all elements when all satisfy the guard", () => {
    const result = Tyneq.from([1, 2, 3]).ofType(isNumber).toArray();
    expect(result).toEqual([1, 2, 3]);
  });

  it("returns empty sequence when source is empty", () => {
    expect(Tyneq.from<number>([]).ofType(isNumber).toArray()).toEqual([]);
  });

  it("can be used in a chain", () => {
    const mixed: (string | number)[] = ["x", 1, "y", 2];
    const result = Tyneq.from(mixed)
      .ofType(isNumber)
      .select((n) => n * 10)
      .toArray();
    expect(result).toEqual([10, 20]);
  });

  it("returned sequence can be iterated more than once", () => {
    const seq = Tyneq.from([1, "a", 2, "b"]).ofType(isString);
    expect(seq.toArray()).toEqual(["a", "b"]);
    expect(seq.toArray()).toEqual(["a", "b"]);
  });

  it("throws ArgumentNullError immediately when guard is null", () => {
    expect(() =>
      Tyneq.from([1, 2, 3]).ofType(null as any)
    ).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError immediately when guard is undefined", () => {
    expect(() =>
      Tyneq.from([1, 2, 3]).ofType(undefined as any)
    ).toThrow(ArgumentError);
  });

  it("validate fires before source is iterated", () => {
    let iterated = false;
    const source = (function* () {
      iterated = true;
      yield 1;
    })();

    expect(() =>
      Tyneq.from(source).ofType(null as any)
    ).toThrow(ArgumentNullError);

    expect(iterated).toBe(false);
  });
});
