import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("shuffle", () => {
  it("keeps all original elements", () => {
    const source = [1, 2, 3, 4, 5];
    const result = Tyneq.from(source).shuffle().orderBy((x) => x).toArray();
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });
});
