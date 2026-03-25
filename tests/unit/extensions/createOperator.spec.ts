import { describe, expect, it } from "vitest";
import { Tyneq, createOperator, createStreamingOperator, createTerminalOperator, ArgumentError } from "../../../src";

// Each test needs a unique operator name because registrations permanently mutate
// TyneqEnumerableBase.prototype for the lifetime of the process.
const UID = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
let counter = 0;
const nextName = (tag: string): string => `__tyneqSpecTest_${tag}_${UID}_${counter++}`;

describe("createOperator", () => {
  it("registers a working streaming operator on TyneqEnumerableBase.prototype", () => {
    const name = nextName("op");
    createOperator<number, [number], number>({
      name,
      factory(source, multiplier) {
        return {
          getEnumerator() {
            function* gen() {
              for (const item of source) yield item * multiplier;
            }
            return gen() as any;
          }
        };
      }
    });

    const result = (Tyneq.from([1, 2, 3]) as any)[name](2).toArray();
    expect(result).toEqual([2, 4, 6]);
  });

  it("the registered operator is accessible on a chained sequence", () => {
    const name = nextName("opChain");
    createOperator<number, [], number>({
      name,
      factory(source) {
        return {
          getEnumerator() {
            function* gen() {
              for (const item of source) yield item + 1;
            }
            return gen() as any;
          }
        };
      }
    });

    const result = (Tyneq.from([1, 2, 3]).where((x) => x > 1) as any)[name]().toArray();
    expect(result).toEqual([3, 4]);
  });

  it("validate fires at call site before any source iteration", () => {
    const name = nextName("opValidate");
    createOperator<number, [number], number>({
      name,
      factory(source, _multiplier) {
        return {
          getEnumerator() {
            function* gen() { for (const item of source) yield item; }
            return gen() as any;
          }
        };
      },
      validate(multiplier) {
        if (multiplier <= 0) throw new ArgumentError("multiplier must be positive", "multiplier");
      }
    });

    let iterated = false;
    const source = (function* () {
      iterated = true;
      yield 1;
    })();

    expect(() => (Tyneq.from(source) as any)[name](-1)).toThrow(ArgumentError);
    expect(iterated).toBe(false);
  });

  it("throws an Error when registering a duplicate operator name", () => {
    const name = nextName("opDup");
    createOperator({ name, factory: (source) => ({ getEnumerator: () => (source as any)[Symbol.iterator]() }) });

    expect(() =>
      createOperator({ name, factory: (source) => ({ getEnumerator: () => (source as any)[Symbol.iterator]() }) })
    ).toThrow(Error);
  });

  it("duplicate registration error message includes the conflicting operator name", () => {
    const name = nextName("opDupMsg");
    createOperator({ name, factory: (source) => ({ getEnumerator: () => (source as any)[Symbol.iterator]() }) });

    expect(() =>
      createOperator({ name, factory: (source) => ({ getEnumerator: () => (source as any)[Symbol.iterator]() }) })
    ).toThrow(name);
  });
});

describe("createStreamingOperator", () => {
  it("registers a working generator operator on TyneqEnumerableBase.prototype", () => {
    const name = nextName("genOp");
    createStreamingOperator<number, [number], number>({
      name,
      *generator(source, addend) {
        for (const item of source) yield item + addend;
      }
    });

    const result = (Tyneq.from([10, 20, 30]) as any)[name](5).toArray();
    expect(result).toEqual([15, 25, 35]);
  });

  it("registered generator operator produces results on repeated iteration", () => {
    const name = nextName("genOpReiter");
    createStreamingOperator<number, [], number>({
      name,
      *generator(source) {
        for (const item of source) yield item * 2;
      }
    });

    const seq = (Tyneq.from([1, 2, 3]) as any)[name]();
    expect(seq.toArray()).toEqual([2, 4, 6]);
    expect(seq.toArray()).toEqual([2, 4, 6]);
  });

  it("validate fires at call site before any source iteration", () => {
    const name = nextName("genOpValidate");
    createStreamingOperator<number, [number], number>({
      name,
      *generator(source, _addend) { yield* source; },
      validate(addend) {
        if (typeof addend !== "number") throw new ArgumentError("addend must be a number", "addend");
      }
    });

    let iterated = false;
    const source = (function* () {
      iterated = true;
      yield 1;
    })();

    expect(() => (Tyneq.from(source) as any)[name]("bad" as any)).toThrow(ArgumentError);
    expect(iterated).toBe(false);
  });

  it("throws an Error when registering a duplicate generator operator name", () => {
    const name = nextName("genOpDup");
    createStreamingOperator({ name, *generator(source) { yield* source as any; } });

    expect(() =>
      createStreamingOperator({ name, *generator(source) { yield* source as any; } })
    ).toThrow(Error);
  });

  it("duplicate registration error message includes the conflicting operator name", () => {
    const name = nextName("genOpDupMsg");
    createStreamingOperator({ name, *generator(source) { yield* source as any; } });

    expect(() =>
      createStreamingOperator({ name, *generator(source) { yield* source as any; } })
    ).toThrow(name);
  });
});

describe("createTerminalOperator", () => {
  it("registers a working terminal operator on TyneqEnumerableBase.prototype", () => {
    const name = nextName("termOp");
    createTerminalOperator<number, [], number>({
      name,
      execute(source) {
        let sum = 0;
        for (const item of source) sum += item;
        return sum;
      }
    });

    const result = (Tyneq.from([1, 2, 3, 4]) as any)[name]();
    expect(result).toBe(10);
  });

  it("registered terminal operator receives user arguments correctly", () => {
    const name = nextName("termOpArgs");
    createTerminalOperator<number, [number], number>({
      name,
      execute(source, factor) {
        let sum = 0;
        for (const item of source) sum += item;
        return sum * factor;
      }
    });

    const result = (Tyneq.from([1, 2, 3]) as any)[name](3);
    expect(result).toBe(18);
  });

  it("validate fires before execute (before source is consumed)", () => {
    const name = nextName("termOpValidate");
    createTerminalOperator<number, [number], null>({
      name,
      execute(source, _factor) {
        for (const _ of source) { /* consume */ }
        return null;
      },
      validate(factor) {
        if (factor <= 0) throw new ArgumentError("factor must be positive", "factor");
      }
    });

    let iterated = false;
    const source = (function* () {
      iterated = true;
      yield 1;
    })();

    expect(() => (Tyneq.from(source) as any)[name](-1)).toThrow(ArgumentError);
    expect(iterated).toBe(false);
  });

  it("throws an Error when registering a duplicate terminal operator name", () => {
    const name = nextName("termOpDup");
    createTerminalOperator({ name, execute: () => null });

    expect(() =>
      createTerminalOperator({ name, execute: () => null })
    ).toThrow(Error);
  });

  it("duplicate registration error message includes the conflicting operator name", () => {
    const name = nextName("termOpDupMsg");
    createTerminalOperator({ name, execute: () => null });

    expect(() =>
      createTerminalOperator({ name, execute: () => null })
    ).toThrow(name);
  });
});
