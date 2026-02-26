import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("memoize", () => {
  it("caches sequence values until refresh", () => {
    let executions = 0;
    const cached = Tyneq.range(1, 3)
      .tap(() => {
        executions++;
      })
      .memoize();

    expect(cached.toArray()).toEqual([1, 2, 3]);
    expect(cached.toArray()).toEqual([1, 2, 3]);
    expect(executions).toBe(3);

    cached.refresh();
    expect(cached.toArray()).toEqual([1, 2, 3]);
    expect(executions).toBe(6);
  });
});
