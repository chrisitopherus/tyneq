import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("defaultIfEmpty", () => {
  it("returns default value when source is empty", () => {
    expect(Tyneq.empty<number>().defaultIfEmpty(5).toArray()).toEqual([5]);
  });

  it("returns original sequence when source is not empty", () => {
    expect(Tyneq.from([1, 2, 3]).defaultIfEmpty(5).toArray()).toEqual([1, 2, 3]);
  });

  it("does not consume first element from one-shot iterables", () => {
    function* source(): Generator<number, void, undefined> {
      yield 10;
      yield 20;
    }

    expect(Tyneq.from(source()).defaultIfEmpty(5).toArray()).toEqual([10, 20]);
  });

  it("uses a falsy default value (0) correctly", () => {
    expect(Tyneq.empty<number>().defaultIfEmpty(0).toArray()).toEqual([0]);
  });

  it("produces the same results on repeated iteration", () => {
    const seq = Tyneq.from<number>([]).defaultIfEmpty(99);
    expect(seq.toArray()).toEqual([99]);
    expect(seq.toArray()).toEqual([99]);
  });
});
