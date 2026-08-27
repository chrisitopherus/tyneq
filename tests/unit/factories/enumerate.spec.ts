import { describe, expect, it } from "vitest";
import {
    Tyneq,
    ArgumentError,
    ArgumentNullError,
    ArgumentTypeError,
    tyneqQueryNode,
    OperatorRegistry,
    QueryPlanCompiler,
} from "../../../src";

describe("Tyneq.enumerate", () => {
    describe("normal usage", () => {
        it("pairs each element with its zero-based index", () => {
            expect(Tyneq.from(Tyneq.enumerate(["a", "b", "c"])).toArray()).toEqual([
                [0, "a"],
                [1, "b"],
                [2, "c"]
            ]);
        });

        it("indices start at 0", () => {
            const [[first]] = Tyneq.from(Tyneq.enumerate(["x"])).toArray();
            expect(first).toBe(0);
        });

        it("works with numeric values", () => {
            expect(Tyneq.from(Tyneq.enumerate([10, 20, 30])).toArray()).toEqual([
                [0, 10],
                [1, 20],
                [2, 30]
            ]);
        });

        it("works with a Set (insertion order)", () => {
            expect(Tyneq.from(Tyneq.enumerate(new Set(["a", "b"]))).toArray()).toEqual([
                [0, "a"],
                [1, "b"]
            ]);
        });
    });

    describe("edge cases", () => {
        it("returns an empty sequence for an empty array", () => {
            expect(Tyneq.from(Tyneq.enumerate([])).toArray()).toEqual([]);
        });

        it("returns a single pair for a single-element array", () => {
            expect(Tyneq.from(Tyneq.enumerate(["only"])).toArray()).toEqual([[0, "only"]]);
        });

        it("is re-iterable with independent index counters", () => {
            const seq = Tyneq.enumerate(["a", "b"]);
            expect(Tyneq.from(seq).toArray()).toEqual([[0, "a"], [1, "b"]]);
            expect(Tyneq.from(seq).toArray()).toEqual([[0, "a"], [1, "b"]]);
        });
    });

    describe("invalid arguments", () => {
        it("throws ArgumentNullError when source is null", () => {
            expect(() => Tyneq.enumerate(null as any)).toThrow(ArgumentNullError);
        });

        it("throws ArgumentError when source is undefined", () => {
            expect(() => Tyneq.enumerate(undefined as any)).toThrow(ArgumentError);
        });

        it("throws ArgumentTypeError when source is not iterable", () => {
            expect(() => Tyneq.enumerate(42 as any)).toThrow(ArgumentTypeError);
        });
    });

    describe("proper source registration (F21)", () => {
        it("is registered in the source namespace as 'enumerate', not delegated to 'from'", () => {
            expect(OperatorRegistry.hasSource("enumerate")).toBe(true);
        });

        it("appears in OperatorRegistry.listSources()", () => {
            const names = OperatorRegistry.listSources().map((m) => m.name);
            expect(names).toContain("enumerate");
        });

        it("produces a query plan node named 'enumerate', not 'from'", () => {
            const seq = Tyneq.enumerate(["a", "b"]);
            const node = seq[tyneqQueryNode]!;
            expect(node.operatorName).toBe("enumerate");
            expect(node.category).toBe("source");
        });

        it("the plan node's args contain the original source iterable", () => {
            const source = ["a", "b"];
            const seq = Tyneq.enumerate(source);
            const node = seq[tyneqQueryNode]!;
            expect(node.args).toEqual([source]);
        });

        it("compiles correctly via QueryPlanCompiler", () => {
            const seq = Tyneq.enumerate(["x", "y", "z"]);
            const node = seq[tyneqQueryNode]!;
            const compiled = new QueryPlanCompiler().compile<[number, string]>(node);
            expect(compiled.toArray()).toEqual([[0, "x"], [1, "y"], [2, "z"]]);
        });

        it("compiled result matches the live sequence's output for the same plan", () => {
            const seq = Tyneq.enumerate(["p", "q"]);
            const node = seq[tyneqQueryNode]!;
            const compiled = new QueryPlanCompiler().compile<[number, string]>(node);
            expect(compiled.toArray()).toEqual(seq.toArray());
        });

        it("chained operators after enumerate() produce an operator node whose source is the enumerate node", () => {
            const seq = Tyneq.enumerate(["a", "b", "c"]).where(([index]) => index > 0);
            const node = seq[tyneqQueryNode]!;
            expect(node.operatorName).toBe("where");
            expect(node.source?.operatorName).toBe("enumerate");
        });
    });
});
