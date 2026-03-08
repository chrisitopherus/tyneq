import { describe, expect, it } from "vitest";
import { Tyneq, createOperator, createGeneratorOperator, createTerminalOperator } from "../../../src";

// Each test needs a unique operator name because registrations permanently mutate
// TyneqEnumerableBase.prototype for the lifetime of the process.
const UID = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
let counter = 0;
const nextName = (tag: string): string => `__tyneqSpecTest_${tag}_${UID}_${counter++}`;

describe("createOperator", () => {
  it("registers a working streaming operator on TyneqEnumerableBase.prototype", () => {
    const name = nextName("op");
    createOperator<number, number, [number]>({
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
    createOperator<number, number, []>({
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

describe("createGeneratorOperator", () => {
  it("registers a working generator operator on TyneqEnumerableBase.prototype", () => {
    const name = nextName("genOp");
    createGeneratorOperator<number, number, [number]>({
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
    createGeneratorOperator<number, number, []>({
      name,
      *generator(source) {
        for (const item of source) yield item * 2;
      }
    });

    const seq = (Tyneq.from([1, 2, 3]) as any)[name]();
    expect(seq.toArray()).toEqual([2, 4, 6]);
    expect(seq.toArray()).toEqual([2, 4, 6]);
  });

  it("throws an Error when registering a duplicate generator operator name", () => {
    const name = nextName("genOpDup");
    createGeneratorOperator({ name, *generator(source) { yield* source as any; } });

    expect(() =>
      createGeneratorOperator({ name, *generator(source) { yield* source as any; } })
    ).toThrow(Error);
  });

  it("duplicate registration error message includes the conflicting operator name", () => {
    const name = nextName("genOpDupMsg");
    createGeneratorOperator({ name, *generator(source) { yield* source as any; } });

    expect(() =>
      createGeneratorOperator({ name, *generator(source) { yield* source as any; } })
    ).toThrow(name);
  });
});

describe("createTerminalOperator", () => {
  it("registers a working terminal operator on TyneqEnumerableBase.prototype", () => {
    const name = nextName("termOp");
    createTerminalOperator<number, number, []>({
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
    createTerminalOperator<number, number, [number]>({
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
