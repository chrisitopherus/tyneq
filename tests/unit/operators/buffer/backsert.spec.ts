import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentError, ArgumentNullError } from "../../../../src";

describe("backsert", () => {
  it("inserts from the back where 0 is last position", () => {
    const result = Tyneq.from([1, 2, 3, 4]).backsert(0, [9]).toArray();
    expect(result).toEqual([1, 2, 3, 9, 4]);
  });

  it("prepends when back index is larger than sequence length", () => {
    const result = Tyneq.from([2, 3]).backsert(10, [1]).toArray();
    expect(result).toEqual([1, 2, 3]);
  });

  it("inserts at index 1 from back", () => {
    const result = Tyneq.from([1, 2, 3]).backsert(1, [9, 10]).toArray();
    expect(result).toEqual([1, 9, 10, 2, 3]);
  });

  it("returns only inserted sequence when source is empty", () => {
    const result = Tyneq.from<number>([]).backsert(0, [1, 2]).toArray();
    expect(result).toEqual([1, 2]);
  });

  it("inserts nothing when other is empty", () => {
    const result = Tyneq.from([1, 2, 3]).backsert(0, []).toArray();
    expect(result).toEqual([1, 2, 3]);
  });

  it("returns empty when both source and other are empty", () => {
    const result = Tyneq.from([]).backsert(0, []).toArray();
    expect(result).toEqual([]);
  });

  it("re-iterates independently", () => {
    const seq = Tyneq.from([1, 2]).backsert(0, [9]);
    expect(seq.toArray()).toEqual([1, 9, 2]);
    expect(seq.toArray()).toEqual([1, 9, 2]);
  });

  it("throws ArgumentNullError when other is null", () => {
    expect(() => Tyneq.from([1]).backsert(0, null as any)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when other is undefined", () => {
    expect(() => Tyneq.from([1]).backsert(0, undefined as any)).toThrow(ArgumentError);
  });
});
