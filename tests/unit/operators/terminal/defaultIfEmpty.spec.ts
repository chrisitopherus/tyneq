import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("defaultIfEmpty", () => {
  it("returns default value when source is empty", () => {
    expect(Tyneq.empty<number>().defaultIfEmpty(5).toArray()).toEqual([5]);
  });
});
