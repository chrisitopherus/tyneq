import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("tapIf", () => {
  it("runs side effects only when predicate is true", () => {
    const seen: number[] = [];
    const result = Tyneq.from([1, 2, 3]).tapIf((x) => seen.push(x), () => false).toArray();

    expect(result).toEqual([1, 2, 3]);
    expect(seen).toEqual([]);
  });
});
