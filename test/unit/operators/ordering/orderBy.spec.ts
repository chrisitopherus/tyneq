import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("orderBy", () => {
  it("sorts ascending and supports thenBy", () => {
    const source = [
      { team: "b", score: 2, name: "z" },
      { team: "a", score: 2, name: "b" },
      { team: "a", score: 1, name: "c" }
    ];

    const result = Tyneq.from(source)
      .orderBy(x => x.score)
      .thenBy(x => x.team)
      .select(x => `${x.score}-${x.team}-${x.name}`)
      .toArray();

    expect(result).toEqual(["1-a-c", "2-a-b", "2-b-z"]);
  });
});
