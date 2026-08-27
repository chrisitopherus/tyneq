import { describe, expect, it } from "vitest";
import { Tyneq, InvalidOperationError } from "../../../../src";

describe("join", () => {
  it("performs inner join by key", () => {
    const users = [{ id: 1, n: "a" }, { id: 2, n: "b" }];
    const posts = [{ userId: 1, t: "x" }, { userId: 1, t: "y" }, { userId: 3, t: "z" }];

    const result = Tyneq.from(users).join(posts, (u) => u.id, (p) => p.userId, (u, p) => `${u.n}:${p.t}`).toArray();
    expect(result).toEqual(["a:x", "a:y"]);
  });

  it("throws InvalidOperationError on the second full iteration when inner is a one-shot generator (F3)", () => {
    const users = [{ id: 1, n: "a" }];
    function* posts() { yield { userId: 1, t: "x" }; }

    const seq = Tyneq.from(users).join(posts(), (u) => u.id, (p) => p.userId, (u, p) => `${u.n}:${p.t}`);
    expect(seq.toArray()).toEqual(["a:x"]);
    expect(() => seq.toArray()).toThrow(InvalidOperationError);
  });
});
