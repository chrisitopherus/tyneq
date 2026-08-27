import { describe, expect, it } from "vitest";
import { Tyneq, InvalidOperationError } from "../../../../src";

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

    it("rethrows the upstream error on the failing iteration instead of truncating (F2)", () => {
        function* flaky(): Generator<number> {
            yield 1;
            yield 2;
            throw new Error("flaky");
        }

        const cached = Tyneq.from({ [Symbol.iterator]: flaky }).memoize();

        expect(() => cached.toArray()).toThrow("flaky");
    });

    it("replays the cached error on every subsequent iteration until refresh (F2)", () => {
        let pulls = 0;
        function* flaky(): Generator<number> {
            pulls++;
            yield 1;
            pulls++;
            yield 2;
            pulls++;
            throw new Error("flaky");
        }

        const cached = Tyneq.from({ [Symbol.iterator]: flaky }).memoize();

        expect(() => cached.toArray()).toThrow("flaky");
        expect(() => cached.toArray()).toThrow("flaky");
        expect(pulls).toBe(3);

        cached.refresh();
        expect(() => cached.toArray()).toThrow("flaky");
        expect(pulls).toBe(6);
    });

    it("preserves the primary error even if disposing the dead source enumerator itself throws", () => {
        let returnCalls = 0;
        const source: Iterable<number> = {
            [Symbol.iterator](): Iterator<number> {
                let index = 0;
                return {
                    next(): IteratorResult<number> {
                        if (index === 0) {
                            index++;
                            return { done: false, value: 1 };
                        }

                        throw new Error("primary");
                    },
                    return(): IteratorResult<number> {
                        returnCalls++;
                        throw new Error("secondary");
                    }
                };
            }
        };

        const cached = Tyneq.from(source).memoize();

        expect(() => cached.toArray()).toThrow("primary");
        expect(returnCalls).toBe(1);
        expect(() => cached.toArray()).toThrow("primary");
    });

    it("still serves the successfully cached prefix before rethrowing the cached error", () => {
        function* flaky(): Generator<number> {
            yield 1;
            yield 2;
            throw new Error("flaky");
        }

        const cached = Tyneq.from({ [Symbol.iterator]: flaky }).memoize();
        const enumerator = cached.getEnumerator();

        expect(enumerator.next()).toEqual({ done: false, value: 1 });
        expect(enumerator.next()).toEqual({ done: false, value: 2 });
        expect(() => enumerator.next()).toThrow("flaky");

        const secondEnumerator = cached.getEnumerator();
        expect(secondEnumerator.next()).toEqual({ done: false, value: 1 });
        expect(secondEnumerator.next()).toEqual({ done: false, value: 2 });
        expect(() => secondEnumerator.next()).toThrow("flaky");
    });

    describe("refresh() mid-iteration (F13)", () => {
        it("throws InvalidOperationError on a stale enumerator's next() after a concurrent refresh()", () => {
            const cached = Tyneq.range(1, 5).memoize();
            const enumerator = cached.getEnumerator();

            expect(enumerator.next()).toEqual({ done: false, value: 1 });
            expect(enumerator.next()).toEqual({ done: false, value: 2 });

            cached.refresh();

            expect(() => enumerator.next()).toThrow(InvalidOperationError);
        });

        it("does not silently replay from the new generation's start, splicing generations together", () => {
            let generationValues = [1, 2, 3];
            const cached = Tyneq.from({
                [Symbol.iterator]: () => generationValues[Symbol.iterator]()
            }).memoize();

            const staleEnumerator = cached.getEnumerator();
            expect(staleEnumerator.next()).toEqual({ done: false, value: 1 });

            generationValues = [10, 20, 30];
            cached.refresh();

            // Without the fix, this would silently yield 10 (from the new generation)
            // instead of continuing generation 0's sequence - now it throws instead.
            expect(() => staleEnumerator.next()).toThrow(InvalidOperationError);
        });

        it("a fresh enumerator created after refresh() is unaffected and reads the new generation normally", () => {
            let executions = 0;
            const cached = Tyneq.range(1, 3).tap(() => { executions++; }).memoize();

            const staleEnumerator = cached.getEnumerator();
            staleEnumerator.next();

            cached.refresh();

            const freshEnumerator = cached.getEnumerator();
            expect(freshEnumerator.next()).toEqual({ done: false, value: 1 });
            expect(freshEnumerator.next()).toEqual({ done: false, value: 2 });
            expect(freshEnumerator.next()).toEqual({ done: false, value: 3 });
            expect(freshEnumerator.next()).toEqual({ done: true, value: undefined });
        });

        it("a fully-consumed enumerator (already done) is unaffected by a later refresh()", () => {
            const cached = Tyneq.range(1, 2).memoize();
            expect(cached.toArray()).toEqual([1, 2]);

            const enumerator = cached.getEnumerator();
            expect(enumerator.next()).toEqual({ done: false, value: 1 });
            expect(enumerator.next()).toEqual({ done: false, value: 2 });
            expect(enumerator.next()).toEqual({ done: true, value: undefined });

            cached.refresh();

            // TyneqBaseEnumerator's own completed-state guard returns done without
            // ever reaching tryGetAtFromCache again, so no stale-generation error fires here.
            expect(enumerator.next()).toEqual({ done: true, value: undefined });
        });
    });
});
