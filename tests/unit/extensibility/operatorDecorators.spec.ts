import { describe, expect, it } from "vitest";
import {
  Tyneq,
  createOperator,
  SequenceContainsNoElementsError,
  ArgumentNullError,
  ArgumentError,
  ArgumentOutOfRangeError,
} from "../../../src";

// ─────────────────────────────────────────────────────────────────────────────
// @operator decorator tests
//
// The @operator decorator fires at class-definition time (module evaluation).
// Importing from "../../../../src" causes all operator files to be evaluated via
// the operators/extensions barrel, which registers every operator as a side-effect.
// We verify correct registration by exercising the resulting methods directly.
// ─────────────────────────────────────────────────────────────────────────────

describe("@operator decorator", () => {
  describe("streaming operator registration", () => {
    it("scan is accessible on Tyneq sequences and produces running accumulations", () => {
      const result = Tyneq.from([1, 2, 3, 4, 5])
        .scan(0, (acc, n) => acc + n)
        .toArray();
      expect(result).toEqual([1, 3, 6, 10, 15]);
    });

    it("populate is accessible on Tyneq sequences and replaces all elements", () => {
      const result = Tyneq.from([1, 2, 3]).populate("x").toArray();
      expect(result).toEqual(["x", "x", "x"]);
    });

    it("where is accessible on Tyneq sequences and filters elements by predicate", () => {
      const result = Tyneq.from([1, 2, 3, 4, 5])
        .where((x) => x % 2 === 0)
        .toArray();
      expect(result).toEqual([2, 4]);
    });
  });

  describe("operator returns a re-iterable sequence", () => {
    it("the sequence returned by scan can be iterated more than once", () => {
      const seq = Tyneq.from([1, 2, 3]).scan(0, (acc, n) => acc + n);
      expect(seq.toArray()).toEqual([1, 3, 6]);
      expect(seq.toArray()).toEqual([1, 3, 6]);
    });

    it("the sequence returned by populate can be iterated more than once", () => {
      const seq = Tyneq.from([1, 2]).populate(99);
      expect(seq.toArray()).toEqual([99, 99]);
      expect(seq.toArray()).toEqual([99, 99]);
    });
  });

  describe("validate fires at call site, not during iteration", () => {
    it("chunk throws ArgumentOutOfRangeError immediately when size is invalid, before any iteration", () => {
      let iterated = false;
      const source = (function* () {
        iterated = true;
        yield 1;
      })();

      expect(() =>
        Tyneq.from(source).chunk(-1)
      ).toThrow(ArgumentOutOfRangeError);

      expect(iterated).toBe(false);
    });

    it("chunk throws ArgumentOutOfRangeError immediately even with an eager array source", () => {
      expect(() =>
        Tyneq.from([1, 2, 3]).chunk(0)
      ).toThrow(ArgumentOutOfRangeError);
    });
  });

  describe("duplicate registration guard", () => {
    it("attempting to register the same name again via createOperator throws an Error", () => {
      expect(() =>
        createOperator({
          name: "scan",
          factory: (source) => ({ getEnumerator: () => (source as any)[Symbol.iterator]() }),
        })
      ).toThrow(Error);
    });

    it("the duplicate registration error message contains the conflicting operator name", () => {
      expect(() =>
        createOperator({
          name: "where",
          factory: (source) => ({ getEnumerator: () => (source as any)[Symbol.iterator]() }),
        })
      ).toThrow("where");
    });

    it("the duplicate registration error message contains the conflicting operator name for populate", () => {
      expect(() =>
        createOperator({
          name: "populate",
          factory: (source) => ({ getEnumerator: () => (source as any)[Symbol.iterator]() }),
        })
      ).toThrow("populate");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @terminal decorator tests
//
// The @terminal decorator wires a class implementing process() so that calling
// seq.operatorName(...) immediately evaluates and returns a concrete value
// (not another enumerable). We verify this by checking that the result is a
// plain value, not a sequence.
// ─────────────────────────────────────────────────────────────────────────────

describe("@terminal decorator", () => {
  describe("terminal operator registration", () => {
    it("aggregate is accessible and returns a plain value (not an enumerable)", () => {
      const result = Tyneq.from([1, 2, 3]).aggregate(
        0,
        (acc, n) => acc + n,
        (acc) => acc
      );
      expect(typeof result).toBe("number");
      expect(result).toBe(6);
    });

    it("average is accessible and returns a plain number", () => {
      const result = Tyneq.from([2, 4, 6]).average((x) => x);
      expect(typeof result).toBe("number");
      expect(result).toBe(4);
    });

    it("minMax is accessible and returns an object with min and max properties", () => {
      const result = Tyneq.from([5, 1, 8, 3]).minMax();
      expect(result).toHaveProperty("min", 1);
      expect(result).toHaveProperty("max", 8);
    });
  });

  describe("terminal operator evaluates immediately", () => {
    it("aggregate evaluates the sequence immediately when called", () => {
      let evaluated = false;
      const source = (function* () {
        evaluated = true;
        yield 1;
        yield 2;
        yield 3;
      })();

      Tyneq.from(source).aggregate(0, (acc, n) => acc + n, (acc) => acc);
      expect(evaluated).toBe(true);
    });

    it("minMax throws SequenceContainsNoElementsError immediately for an empty sequence", () => {
      expect(() =>
        Tyneq.from<number>([]).minMax()
      ).toThrow(SequenceContainsNoElementsError);
    });

    it("aggregate enforces argument validation immediately (null func throws ArgumentNullError)", () => {
      expect(() =>
        Tyneq.from([1]).aggregate(0, null as any, (acc) => acc)
      ).toThrow(ArgumentNullError);
    });

    it("average enforces argument validation immediately (undefined selector throws ArgumentError)", () => {
      expect(() =>
        Tyneq.from([1]).average(undefined as any)
      ).toThrow(ArgumentError);
    });

    it("validate fires before source is iterated: aggregate with null func does not consume the source", () => {
      let iterated = false;
      const source = (function* () {
        iterated = true;
        yield 1;
      })();

      expect(() =>
        Tyneq.from(source).aggregate(0, null as any, (acc) => acc)
      ).toThrow(ArgumentNullError);

      expect(iterated).toBe(false);
    });
  });

  describe("duplicate registration guard", () => {
    it("attempting to register the same name again via createOperator throws an Error", () => {
      expect(() =>
        createOperator({
          name: "aggregate",
          factory: (source) => ({ getEnumerator: () => (source as any)[Symbol.iterator]() }),
        })
      ).toThrow(Error);
    });

    it("the duplicate registration error message contains the conflicting terminal operator name", () => {
      expect(() =>
        createOperator({
          name: "minMax",
          factory: (source) => ({ getEnumerator: () => (source as any)[Symbol.iterator]() }),
        })
      ).toThrow("minMax");
    });
  });
});
