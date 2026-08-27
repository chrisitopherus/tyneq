import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentError, ArgumentNullError, InvalidOperationError } from "../../../../src";

describe("groupJoin", () => {
  it("left-joins and groups inner matches", () => {
    const users = [{ id: 1 }, { id: 2 }];
    const posts = [{ userId: 1, t: "a" }, { userId: 1, t: "b" }];

    const result = Tyneq.from(users).groupJoin(
      posts,
      (u) => u.id,
      (p) => p.userId,
      (u, group) => ({ id: u.id, posts: group.select((p) => p.t).toArray() })
    ).toArray();

    expect(result).toEqual([
      { id: 1, posts: ["a", "b"] },
      { id: 2, posts: [] }
    ]);
  });

  it("returns empty group for outer elements with no inner matches", () => {
    const result = Tyneq.from([1, 2, 3]).groupJoin(
      [],
      (x) => x,
      (x) => x,
      (outer, group) => ({ outer, count: group.count() })
    ).toArray();

    expect(result).toEqual([
      { outer: 1, count: 0 },
      { outer: 2, count: 0 },
      { outer: 3, count: 0 },
    ]);
  });

  it("returns empty sequence when outer is empty", () => {
    const result = Tyneq.from<number>([]).groupJoin(
      [1, 2],
      (x) => x,
      (x) => x,
      (outer, group) => ({ outer, count: group.count() })
    ).toArray();

    expect(result).toEqual([]);
  });

  it("groups multiple inner elements per outer key", () => {
    const result = Tyneq.from([10, 20]).groupJoin(
      [10, 10, 20],
      (x) => x,
      (x) => x,
      (outer, group) => group.count()
    ).toArray();

    expect(result).toEqual([2, 1]);
  });

  it("re-iterates independently", () => {
    const outer = [{ id: 1 }];
    const inner = [{ id: 1, v: "x" }];
    const seq = Tyneq.from(outer).groupJoin(
      inner,
      (o) => o.id,
      (i) => i.id,
      (o, g) => g.select((i) => i.v).toArray()
    );
    expect(seq.toArray()).toEqual([["x"]]);
    expect(seq.toArray()).toEqual([["x"]]);
  });

  it("throws ArgumentNullError when innerSource is null", () => {
    expect(() =>
      Tyneq.from([1]).groupJoin(null as any, (x) => x, (x) => x, (o, g) => o)
    ).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when innerSource is undefined", () => {
    expect(() =>
      Tyneq.from([1]).groupJoin(undefined as any, (x) => x, (x) => x, (o, g) => o)
    ).toThrow(ArgumentError);
  });

  it("throws ArgumentNullError when outerKeySelector is null", () => {
    expect(() =>
      Tyneq.from([1]).groupJoin([], null as any, (x) => x, (o, g) => o)
    ).toThrow(ArgumentNullError);
  });

  it("throws ArgumentNullError when resultSelector is null", () => {
    expect(() =>
      Tyneq.from([1]).groupJoin([], (x) => x, (x) => x, null as any)
    ).toThrow(ArgumentNullError);
  });

  it("throws InvalidOperationError on the second full iteration when innerSource is a one-shot generator (F3)", () => {
    const outer = [{ id: 1 }];
    function* inner() { yield { id: 1, v: "x" }; }

    const seq = Tyneq.from(outer).groupJoin(
      inner(),
      (o) => o.id,
      (i) => i.id,
      (o, g) => g.select((i) => i.v).toArray()
    );

    expect(seq.toArray()).toEqual([["x"]]);
    expect(() => seq.toArray()).toThrow(InvalidOperationError);
  });
});
