import { describe, expect, it } from "vitest";
import { Tyneq, tyneqQueryNode } from "../../../../src";

describe("pipe", () => {
    it("supports custom iterator factories", () => {
        const result = Tyneq.from([1, 2, 3]).pipe(function* (source) {
            for (const item of source) {
                yield item * 10;
            }
        }).toArray();

        expect(result).toEqual([10, 20, 30]);
    });

    it("records a 'pipe' node in the query plan", () => {
        const factory = function* (source: Iterable<number>) { yield* source; };
        const seq = Tyneq.from([1, 2, 3]).pipe(factory);
        const node = seq[tyneqQueryNode];
        expect(node).not.toBeNull();
        expect(node!.operatorName).toBe("pipe");
        expect(node!.category).toBe("streaming");
        expect(node!.args[0]).toBe(factory);
    });

    it("links the pipe node to its source node", () => {
        const seq = Tyneq.from([1, 2]).pipe(function* (s) { yield* s; });
        const node = seq[tyneqQueryNode]!;
        expect(node.source).not.toBeNull();
        expect(node.source!.operatorName).toBe("from");
    });
});
