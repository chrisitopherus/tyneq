import { describe, expect, it } from "vitest";
import { OperatorRegistry, Tyneq } from "../../src";

// Snapshot of the public operator surface. If you add or remove a public operator,
// update this list. Its purpose is to make accidental renames or removals fail loudly.
// Note: "pipe" is registered as kind "extension" and "memoize" as kind "cache" --
// they are intentionally absent from the streaming/buffer lists below.
const EXPECTED_STREAMING_OPERATORS = [
    "append",
    "chunk",
    "concat",
    "defaultIfEmpty",
    "flatten",
    "ofType",
    "pairwise",
    "populate",
    "prepend",
    "repeat",
    "scan",
    "select",
    "selectMany",
    "skip",
    "skipLast",
    "skipUntil",
    "skipWhile",
    "slice",
    "split",
    "take",
    "takeUntil",
    "takeWhile",
    "tap",
    "tapIf",
    "throttle",
    "where",
    "window",
    "zip",
] as const;

const EXPECTED_BUFFER_OPERATORS = [
    "backsert",
    "distinct",
    "distinctBy",
    "except",
    "exceptBy",
    "groupBy",
    "groupJoin",
    "intersect",
    "intersectBy",
    "join",
    "orderBy",
    "orderByDescending",
    "permutations",
    "reverse",
    "shuffle",
    "thenBy",
    "thenByDescending",
    "union",
    "unionBy",
] as const;

const EXPECTED_TERMINAL_OPERATORS = [
    "aggregate",
    "all",
    "any",
    "average",
    "consume",
    "contains",
    "count",
    "countBy",
    "elementAt",
    "elementAtOrDefault",
    "endsWith",
    "first",
    "firstOrDefault",
    "indexOf",
    "isNullOrEmpty",
    "last",
    "lastOrDefault",
    "max",
    "maxBy",
    "min",
    "minBy",
    "minMax",
    "sequenceEqual",
    "single",
    "singleOrDefault",
    "startsWith",
    "sum",
    "toArray",
    "toAsync",
    "toMap",
    "toRecord",
    "toSet",
] as const;

describe("API surface lock", () => {
    it("registered streaming operators match the expected set", () => {
        const registered = OperatorRegistry.listByKind("streaming")
            .filter((e) => e.source === "internal")
            .map((e) => e.name)
            .sort();
        const expected = [...EXPECTED_STREAMING_OPERATORS].sort();
        expect(registered).toEqual(expected);
    });

    it("registered buffer operators match the expected set", () => {
        const registered = OperatorRegistry.listByKind("buffer")
            .filter((e) => e.source === "internal")
            .map((e) => e.name)
            .sort();
        const expected = [...EXPECTED_BUFFER_OPERATORS].sort();
        expect(registered).toEqual(expected);
    });

    it("registered terminal operators match the expected set", () => {
        const registered = OperatorRegistry.listByKind("terminal")
            .filter((e) => e.source === "internal")
            .map((e) => e.name)
            .sort();
        const expected = [...EXPECTED_TERMINAL_OPERATORS].sort();
        expect(registered).toEqual(expected);
    });

    it("Tyneq static factory methods exist", () => {
        expect(typeof Tyneq.from).toBe("function");
        expect(typeof Tyneq.range).toBe("function");
        expect(typeof Tyneq.empty).toBe("function");
        expect(typeof Tyneq.enumerate).toBe("function");
        expect(typeof Tyneq.random).toBe("function");
        expect(typeof Tyneq.repeat).toBe("function");
        expect(typeof Tyneq.generate).toBe("function");
        expect(typeof Tyneq.concat).toBe("function");
        expect(typeof Tyneq.isNullOrEmpty).toBe("function");
    });
});
