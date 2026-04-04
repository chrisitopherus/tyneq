import { describe, expect, it } from "vitest";
import { QueryPlanPrinter } from "../../../src/queryplan/QueryPlanPrinter";
import { QueryNode } from "../../../src/queryplan/QueryNode";
import type { QueryPlanNode, QueryPlanPrinterOptions, QueryPlanVisitor } from "../../../src/types/queryplan";

// Helper to build a simple source node
function makeSource(name: string, args: readonly unknown[] = []): QueryPlanNode {
    return new QueryNode(name, args, null, "source");
}

// Helper to build an operator node on top of a source
function makeOp(name: string, source: QueryPlanNode, args: readonly unknown[] = []): QueryPlanNode {
    return new QueryNode(name, args, source, "streaming");
}

describe("QueryPlanPrinter", () => {
    describe("visit()", () => {
        it("prints a single source node without an arrow prefix", () => {
            const node = makeSource("from", [[1, 2, 3]]);
            const output = new QueryPlanPrinter().visit(node);
            expect(output).toBe("from([1, 2, 3])");
        });

        it("prints a two-node plan: source then one operator", () => {
            const source = makeSource("range", [1, 5]);
            const op = makeOp("where", source, [() => true]);
            const output = new QueryPlanPrinter().visit(op);
            expect(output).toBe("range(1, 5)\n  -> where(<fn>)");
        });

        it("prints a three-node plan", () => {
            const source = makeSource("range", [1, 10]);
            const where = makeOp("where", source, [() => true]);
            const select = makeOp("select", where, [() => 0]);
            const output = new QueryPlanPrinter().visit(select);
            expect(output).toBe("range(1, 10)\n  -> where(<fn>)\n  -> select(<fn>)");
        });

        it("prints no args when operator has none", () => {
            const source = makeSource("empty");
            const output = new QueryPlanPrinter().visit(source);
            expect(output).toBe("empty()");
        });
    });

    describe("static print()", () => {
        it("delegates to visit() and returns the same string", () => {
            const node = makeSource("range", [1, 5]);
            const printer = new QueryPlanPrinter();
            expect(QueryPlanPrinter.print(node)).toBe(printer.visit(node));
        });

        it("accepts options and applies them", () => {
            const source = makeSource("range", [1, 5]);
            const op = makeOp("where", source, [(x: number) => x > 2]);
            const output = QueryPlanPrinter.print(op, { arrow: "=>", indent: "    " });
            expect(output).toBe("range(1, 5)\n    => where(<fn>)");
        });
    });

    describe("formatArg() - argument rendering", () => {
        // Access through a subclass so we can call the protected method directly
        class ExposedPrinter extends QueryPlanPrinter {
            public expose(arg: unknown): string {
                return this.formatArg(arg);
            }
        }

        const p = new ExposedPrinter();

        it("renders functions as <fn>", () => {
            expect(p.expose(() => 1)).toBe("<fn>");
        });

        it("renders null as 'null'", () => {
            expect(p.expose(null)).toBe("null");
        });

        it("renders undefined as 'undefined'", () => {
            expect(p.expose(undefined)).toBe("undefined");
        });

        it("renders strings with double quotes", () => {
            expect(p.expose("hello")).toBe("\"hello\"");
        });

        it("renders an empty array as []", () => {
            expect(p.expose([])).toBe("[]");
        });

        it("renders a small array inline", () => {
            expect(p.expose([1, 2, 3])).toBe("[1, 2, 3]");
        });

        it("renders an array at the maxInlineArrayItems limit inline", () => {
            // Default maxInlineArrayItems is 3
            expect(p.expose([1, 2, 3])).toBe("[1, 2, 3]");
        });

        it("renders an array exceeding maxInlineArrayItems as [...N items]", () => {
            expect(p.expose([1, 2, 3, 4])).toBe("[...4 items]");
        });

        it("renders objects as {...}", () => {
            expect(p.expose({ key: "value" })).toBe("{...}");
        });

        it("renders numbers via String()", () => {
            expect(p.expose(42)).toBe("42");
        });

        it("renders booleans via String()", () => {
            expect(p.expose(true)).toBe("true");
            expect(p.expose(false)).toBe("false");
        });

        it("renders nested array args recursively", () => {
            expect(p.expose([[1, 2]])).toBe("[[1, 2]]");
        });
    });

    describe("formatLine() - line formatting", () => {
        class ExposedPrinter extends QueryPlanPrinter {
            public exposeLine(name: string, argStr: string, isRoot: boolean): string {
                return this.formatLine(name, argStr, isRoot);
            }
        }

        it("root node has no prefix", () => {
            const p = new ExposedPrinter();
            expect(p.exposeLine("range", "1, 5", true)).toBe("range(1, 5)");
        });

        it("non-root node has indent + arrow prefix", () => {
            const p = new ExposedPrinter();
            expect(p.exposeLine("where", "<fn>", false)).toBe("  -> where(<fn>)");
        });

        it("respects custom indent option", () => {
            const p = new ExposedPrinter({ indent: "    " });
            expect(p.exposeLine("where", "<fn>", false)).toBe("    -> where(<fn>)");
        });

        it("respects custom arrow option", () => {
            const p = new ExposedPrinter({ arrow: "=>" });
            expect(p.exposeLine("where", "<fn>", false)).toBe("  => where(<fn>)");
        });
    });

    describe("options", () => {
        it("uses default indent of two spaces", () => {
            const source = makeSource("from");
            const op = makeOp("where", source, [() => true]);
            expect(new QueryPlanPrinter().visit(op)).toContain("  -> ");
        });

        it("uses default arrow of ->", () => {
            const source = makeSource("from");
            const op = makeOp("where", source);
            expect(new QueryPlanPrinter().visit(op)).toContain(" -> ");
        });

        it("uses custom maxInlineArrayItems", () => {
            const p = new QueryPlanPrinter({ maxInlineArrayItems: 5 });
            const node = makeSource("from", [[1, 2, 3, 4, 5]]);
            expect(new QueryPlanPrinter({ maxInlineArrayItems: 5 }).visit(node)).toBe("from([1, 2, 3, 4, 5])");
        });

        it("exceeds custom maxInlineArrayItems and abbreviates", () => {
            const node = makeSource("from", [[1, 2, 3, 4, 5, 6]]);
            expect(new QueryPlanPrinter({ maxInlineArrayItems: 5 }).visit(node)).toBe("from([...6 items])");
        });
    });

    describe("QueryNode.accept()", () => {
        it("calls visitor.visit() with itself and returns the result", () => {
            const node = makeSource("range", [1, 5]);
            const visitor: QueryPlanVisitor<string> = {
                visit: (n) => `visited:${n.operatorName}`,
            };
            expect(node.accept(visitor)).toBe("visited:range");
        });
    });
});
