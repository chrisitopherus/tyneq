import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("orderByDescending", () => {
  it("sorts descending and supports thenByDescending", () => {
    const source = [
      { team: "a", score: 1, rank: 1 },
      { team: "a", score: 2, rank: 2 },
      { team: "b", score: 2, rank: 1 }
    ];

    const result = Tyneq.from(source)
      .orderByDescending(x => x.score)
      .thenByDescending(x => x.rank)
      .select(x => `${x.score}-${x.rank}`)
      .toArray();

    expect(result).toEqual(["2-2", "2-1", "1-1"]);
  });
});
