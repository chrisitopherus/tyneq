import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("select", () => {
  it("projects each element", () => {
    expect(Tyneq.from([1, 2, 3]).select(x => x * x).toArray()).toEqual([1, 4, 9]);
  });

  it("returns empty sequence when source is empty", () => {
    expect(Tyneq.from<number>([]).select(x => x * 2).toArray()).toEqual([]);
  });

  it("supports type transformation", () => {
    expect(Tyneq.from([1, 2, 3]).select(x => x.toString()).toArray()).toEqual(["1", "2", "3"]);
  });

  it("projects object properties", () => {
    const input = [{ name: "alice", age: 30 }, { name: "bob", age: 25 }];
    expect(Tyneq.from(input).select(x => x.name).toArray()).toEqual(["alice", "bob"]);
  });

  it("throws when selector is null and sequence is iterated", () => {
    expect(() => Tyneq.from([1, 2, 3]).select(null as any).toArray()).toThrow();
  });
});
