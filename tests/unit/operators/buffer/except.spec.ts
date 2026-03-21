import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("except", () => {
  it("returns values not in excluded set", () => {
    expect(Tyneq.from([1, 2, 3, 4]).except([2, 4]).toArray()).toEqual([1, 3]);
  });

  it("returns empty sequence when source is empty", () => {
    expect(Tyneq.from<number>([]).except([1, 2]).toArray()).toEqual([]);
  });

  it("returns source unchanged when excluded set is empty", () => {
    expect(Tyneq.from([1, 2, 3]).except([]).toArray()).toEqual([1, 2, 3]);
  });

  it("returns empty when all source elements are excluded", () => {
    expect(Tyneq.from([1, 2, 3]).except([1, 2, 3]).toArray()).toEqual([]);
  });

  it("does not exclude elements that are not in the source", () => {
    expect(Tyneq.from([1, 2, 3]).except([4, 5, 6]).toArray()).toEqual([1, 2, 3]);
  });

  it("throws when excludedValues is null and sequence is iterated", () => {
    expect(() => Tyneq.from([1, 2, 3]).except(null as any).toArray()).toThrow();
  });
});
