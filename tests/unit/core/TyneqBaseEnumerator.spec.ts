import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../src";

class ResourceTrackingEnumerator<TSource> implements Iterator<TSource> {
    public returnCalled = false;

    private readonly source: TSource[];
    private index = 0;

    public constructor(source: TSource[]) {
        this.source = source;
    }

    public next(): IteratorResult<TSource> {
        if (this.index >= this.source.length) {
            return { done: true, value: undefined };
        }

        return { done: false, value: this.source[this.index++] };
    }

    public return(): IteratorResult<TSource> {
        this.returnCalled = true;
        return { done: true, value: undefined };
    }
}

class ResourceTrackingSource<TSource> implements Iterable<TSource> {
    public readonly tracker: ResourceTrackingEnumerator<TSource>;

    public constructor(source: TSource[]) {
        this.tracker = new ResourceTrackingEnumerator(source);
    }

    public [Symbol.iterator](): Iterator<TSource> {
        return this.tracker;
    }
}

describe("TyneqBaseEnumerator - throw-path lifecycle (F1)", () => {
    it("disposes the upstream source when a selector throws mid-iteration", () => {
        const tracker = new ResourceTrackingSource([1, 2, 3, 4]);
        const seq = Tyneq.from(tracker).select((x) => {
            if (x === 3) {
                throw new Error("boom");
            }

            return x;
        });

        const enumerator = seq.getEnumerator();
        expect(enumerator.next()).toEqual({ done: false, value: 1 });
        expect(enumerator.next()).toEqual({ done: false, value: 2 });
        expect(() => enumerator.next()).toThrow("boom");

        expect(tracker.tracker.returnCalled).toBe(true);
    });

    it("marks the enumerator completed after a throw - next() returns done, not a resumed result", () => {
        const source = [1, 2, 3, 4];
        const seq = Tyneq.from(source).select((x) => {
            if (x === 3) {
                throw new Error("boom");
            }

            return x;
        });

        const enumerator = seq.getEnumerator();
        enumerator.next();
        enumerator.next();
        expect(() => enumerator.next()).toThrow("boom");

        const after = enumerator.next();
        expect(after).toEqual({ done: true, value: undefined });
    });

    it("does not silently skip the failing element and continue on repeated next() calls", () => {
        const source = [1, 2, 3, 4];
        const seq = Tyneq.from(source).select((x) => {
            if (x === 3) {
                throw new Error("boom");
            }

            return x;
        });

        const enumerator = seq.getEnumerator();
        const collected: number[] = [];

        try {
            let result = enumerator.next();
            while (!result.done) {
                collected.push(result.value);
                result = enumerator.next();
            }
        } catch {
            // expected
        }

        expect(collected).toEqual([1, 2]);
        expect(enumerator.next()).toEqual({ done: true, value: undefined });
    });

    it("marks a buffer-kind operator completed (not resumable) when its initialize() throws", () => {
        const seq = Tyneq.from([1, 2, 3]).orderBy((x) => {
            if (x === 2) {
                throw new Error("boom");
            }

            return x;
        });

        const enumerator = seq.getEnumerator();
        expect(() => enumerator.next()).toThrow("boom");
        expect(enumerator.next()).toEqual({ done: true, value: undefined });
    });
});
