import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("groupBy", () => {
  it("groups and projects values", () => {
    const result = Tyneq.from(["a", "bb", "c"]).groupBy(
      x => x.length,
      x => x.toUpperCase(),
      (key, values) => ({ key, values: values.toArray() })
    ).orderBy(x => x.key).toArray();

    expect(result).toEqual([
      { key: 1, values: ["A", "C"] },
      { key: 2, values: ["BB"] }
    ]);
  });
});
