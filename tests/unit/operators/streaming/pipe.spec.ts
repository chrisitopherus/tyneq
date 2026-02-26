import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("pipe", () => {
  it("supports custom iterator factories", () => {
    const result = Tyneq.from([1, 2, 3]).pipe(function* (source) {
      for (const item of source) {
        yield item * 10;
      }
    }).toArray();

    expect(result).toEqual([10, 20, 30]);
  });
});
