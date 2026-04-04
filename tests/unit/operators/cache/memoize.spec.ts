import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("memoize", () => {
    it("caches sequence values until refresh", () => {
        let executions = 0;
        const cached = Tyneq.range(1, 3)
            .tap(() => { executions++; })
            .memoize();

        expect(cached.toArray()).toEqual([1, 2, 3]);
        expect(cached.toArray()).toEqual([1, 2, 3]);
        expect(executions).toBe(3);

        cached.refresh();
        expect(cached.toArray()).toEqual([1, 2, 3]);
        expect(executions).toBe(6);
    });

    it("can be sorted after memoize (createOrderedEnumerable on cached sequence)", () => {
        const result = Tyneq.from([3, 1, 2])
            .memoize()
            .orderBy((x) => x)
            .toArray();
        expect(result).toEqual([1, 2, 3]);
    });

    it("can be memoized again after memoize (createCachedEnumerable on cached sequence)", () => {
        let count = 0;
        const inner = Tyneq.from([1, 2, 3]).tap(() => { count++; }).memoize();
        const outer = inner.memoize();
        expect(outer.toArray()).toEqual([1, 2, 3]);
        expect(outer.toArray()).toEqual([1, 2, 3]);
        expect(count).toBe(3);
    });
});
