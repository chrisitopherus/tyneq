import { describe, expect, it } from "vitest";
import { Tyneq, tyneqQueryNode } from "../../../src";
import type { IQueryNode } from "../../../src";

const sourceNode = (seq: { [tyneqQueryNode]: IQueryNode | null }): IQueryNode => {
    let node = seq[tyneqQueryNode]!;
    while (node.source !== null) node = node.source;

    return node;
};

describe("sourceKind", () => {
    it("is 'array' for Array sources", () => {
        expect(sourceNode(Tyneq.from([1, 2, 3])).sourceKind).toBe("array");
    });

    it("is 'set' for Set sources", () => {
        expect(sourceNode(Tyneq.from(new Set([1, 2]))).sourceKind).toBe("set");
    });

    it("is 'map' for Map sources", () => {
        expect(sourceNode(Tyneq.from(new Map([["a", 1]]))).sourceKind).toBe("map");
    });

    it("is 'string' for string sources", () => {
        expect(sourceNode(Tyneq.from("hello")).sourceKind).toBe("string");
    });

    it("is 'other' for generator iterables", () => {
        function* gen() { yield 1; yield 2; }
        expect(sourceNode(Tyneq.from(gen())).sourceKind).toBe("other");
    });

    it("is undefined on non-source nodes", () => {
        const seq = Tyneq.from([1]).where((x) => x > 0);
        expect(seq[tyneqQueryNode]!.sourceKind).toBeUndefined();
    });

    it("is undefined on range and random sources (no sourceKind)", () => {
        expect(Tyneq.range(1, 3)[tyneqQueryNode]!.sourceKind).toBeUndefined();
    });
});
