import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../src";

describe("Tyneq.empty", () => {
  it("creates an empty sequence", () => {
    expect(Tyneq.empty<number>().toArray()).toEqual([]);
  });
});
