import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("groupJoin", () => {
  it("left-joins and groups inner matches", () => {
    const users = [{ id: 1 }, { id: 2 }];
    const posts = [{ userId: 1, t: "a" }, { userId: 1, t: "b" }];

    const result = Tyneq.from(users).groupJoin(
      posts,
      u => u.id,
      p => p.userId,
      (u, group) => ({ id: u.id, posts: group.select(p => p.t).toArray() })
    ).toArray();

    expect(result).toEqual([
      { id: 1, posts: ["a", "b"] },
      { id: 2, posts: [] }
    ]);
  });
});
