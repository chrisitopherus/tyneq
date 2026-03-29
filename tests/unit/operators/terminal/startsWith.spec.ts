import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("startsWith", () => {
  describe("normal usage", () => {
    it("returns true when sequence starts with prefix", () => {
      expect(Tyneq.from([1, 2, 3]).startsWith([1, 2])).toBe(true);
    });

    it("returns false when sequence does not start with prefix", () => {
      expect(Tyneq.from([1, 2, 3]).startsWith([2, 3])).toBe(false);
    });

    it("returns true when prefix equals the full sequence", () => {
      expect(Tyneq.from([1, 2, 3]).startsWith([1, 2, 3])).toBe(true);
    });

    it("returns false when prefix is longer than the sequence", () => {
      expect(Tyneq.from([1, 2]).startsWith([1, 2, 3])).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns true for an empty prefix", () => {
      expect(Tyneq.from([1, 2]).startsWith([])).toBe(true);
    });

    it("returns true when both source and prefix are empty", () => {
      expect(Tyneq.from<number>([]).startsWith([])).toBe(true);
    });

    it("returns false when source is empty and prefix is not", () => {
      expect(Tyneq.from<number>([]).startsWith([1])).toBe(false);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when sequence is null", () => {
      expect(() => Tyneq.from([1]).startsWith(null as any)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when sequence is undefined", () => {
      expect(() => Tyneq.from([1]).startsWith(undefined as any)).toThrow(ArgumentError);
    });
  });
});
