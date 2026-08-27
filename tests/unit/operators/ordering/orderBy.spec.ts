import { describe, expect, it } from "vitest";
import { ArgumentError, Tyneq } from "../../../../src";

describe("orderBy", () => {
  it("sorts ascending and supports thenBy", () => {
    const source = [
      { team: "b", score: 2, name: "z" },
      { team: "a", score: 2, name: "b" },
      { team: "a", score: 1, name: "c" }
    ];

    const result = Tyneq.from(source)
      .orderBy((x) => x.score)
      .thenBy((x) => x.team)
      .select((x) => `${x.score}-${x.team}-${x.name}`)
      .toArray();

    expect(result).toEqual(["1-a-c", "2-a-b", "2-b-z"]);
  });

  describe("thenBy / thenByDescending eager validation (F16)", () => {
    it("thenBy throws ArgumentError immediately when keySelector is undefined", () => {
      const ordered = Tyneq.from([1, 2, 3]).orderBy((x) => x);
      expect(() => ordered.thenBy(undefined as any)).toThrow(ArgumentError);
    });

    it("thenByDescending throws ArgumentError immediately when keySelector is undefined", () => {
      const ordered = Tyneq.from([1, 2, 3]).orderBy((x) => x);
      expect(() => ordered.thenByDescending(undefined as any)).toThrow(ArgumentError);
    });

    it("thenBy validates before any iteration of the source", () => {
      let iterated = false;
      const source = (function* () {
        iterated = true;
        yield 1;
      })();

      const ordered = Tyneq.from(source).orderBy((x) => x);
      expect(() => ordered.thenBy(undefined as any)).toThrow(ArgumentError);
      expect(iterated).toBe(false);
    });
  });
});
