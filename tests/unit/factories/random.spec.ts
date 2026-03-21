import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../src";

describe("Tyneq.random", () => {
  it("creates a randomized sequence from a source", () => {
    const result = Tyneq.random(4, Math.random).toArray();
    expect(result.length).toEqual(4);
    expect(result.every((x) => typeof x === "number")).toBeTruthy();
  });
});
