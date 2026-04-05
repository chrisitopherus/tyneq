import { describe, expect, it, vi } from "vitest";
import { Tyneq, tyneqQueryNode, QueryPlanWalker } from "../../../src";
import type { IQueryNode } from "../../../src";

// ---------------------------------------------------------------------------
// Subclass-based usage (existing behaviour, preserved)
// ---------------------------------------------------------------------------

class NameCollector extends QueryPlanWalker {
    public readonly names: string[] = [];
    protected override visitNode(node: IQueryNode): void {
        this.names.push(node.operatorName);
    }
}

describe("QueryPlanWalker -- subclass", () => {
    it("visits nodes in source-to-terminal order by default", () => {
        const seq = Tyneq.from([1, 2, 3]).where((x) => x > 1).select((x) => x * 2);
        const collector = new NameCollector();
        collector.visit(seq[tyneqQueryNode]!);
        expect(collector.names).toEqual(["from", "where", "select"]);
    });

    it("visits a single source node", () => {
        const seq = Tyneq.from([1]);
        const collector = new NameCollector();
        collector.visit(seq[tyneqQueryNode]!);
        expect(collector.names).toEqual(["from"]);
    });

    it("counts all nodes in the chain", () => {
        const seq = Tyneq.range(1, 5)
            .where((x) => x > 1)
            .select((x) => x * 2)
            .skip(1);
        const collector = new NameCollector();
        collector.visit(seq[tyneqQueryNode]!);
        expect(collector.names).toHaveLength(4);
    });
});

// ---------------------------------------------------------------------------
// Direct instantiation with callback
// ---------------------------------------------------------------------------

describe("QueryPlanWalker -- callback constructor", () => {
    it("is directly instantiable without subclassing", () => {
        const seq = Tyneq.from([1, 2, 3]).where((x) => x > 1);
        const names: string[] = [];
        new QueryPlanWalker((node) => names.push(node.operatorName)).visit(seq[tyneqQueryNode]!);
        expect(names).toEqual(["from", "where"]);
    });

    it("fires the callback once per node", () => {
        const seq = Tyneq.from([1]).where((x) => x > 0).select((x) => x);
        const cb = vi.fn();
        new QueryPlanWalker(cb).visit(seq[tyneqQueryNode]!);
        expect(cb).toHaveBeenCalledTimes(3);
    });

    it("passes the correct node to each callback invocation", () => {
        const seq = Tyneq.from([1]).where((x) => x > 0);
        const received: string[] = [];
        new QueryPlanWalker((node) => received.push(node.operatorName)).visit(seq[tyneqQueryNode]!);
        expect(received).toEqual(["from", "where"]);
    });

    it("works with no arguments (no-op walk)", () => {
        const seq = Tyneq.from([1, 2, 3]).where((x) => x > 1);
        expect(() => new QueryPlanWalker().visit(seq[tyneqQueryNode]!)).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// Traversal direction
// ---------------------------------------------------------------------------

describe("QueryPlanWalker -- traversal direction", () => {
    it("source-to-terminal visits from source up to terminal", () => {
        const seq = Tyneq.from([1, 2, 3]).where((x) => x > 1).select((x) => x * 2);
        const names: string[] = [];
        new QueryPlanWalker((n) => names.push(n.operatorName), "source-to-terminal").visit(seq[tyneqQueryNode]!);
        expect(names).toEqual(["from", "where", "select"]);
    });

    it("terminal-to-source visits from terminal down to source", () => {
        const seq = Tyneq.from([1, 2, 3]).where((x) => x > 1).select((x) => x * 2);
        const names: string[] = [];
        new QueryPlanWalker((n) => names.push(n.operatorName), "terminal-to-source").visit(seq[tyneqQueryNode]!);
        expect(names).toEqual(["select", "where", "from"]);
    });

    it("direction defaults to source-to-terminal when omitted", () => {
        const seq = Tyneq.from([1]).where((x) => x > 0).select((x) => x);
        const names: string[] = [];
        new QueryPlanWalker((n) => names.push(n.operatorName)).visit(seq[tyneqQueryNode]!);
        expect(names).toEqual(["from", "where", "select"]);
    });

    it("terminal-to-source on a single node visits that node once", () => {
        const seq = Tyneq.from([1]);
        const names: string[] = [];
        new QueryPlanWalker((n) => names.push(n.operatorName), "terminal-to-source").visit(seq[tyneqQueryNode]!);
        expect(names).toEqual(["from"]);
    });
});

// ---------------------------------------------------------------------------
// Subclass with direction forwarded via super constructor
// ---------------------------------------------------------------------------

describe("QueryPlanWalker -- subclass with direction", () => {
    class DirectionalCollector extends QueryPlanWalker {
        public readonly names: string[] = [];
        protected override visitNode(node: IQueryNode): void {
            this.names.push(node.operatorName);
        }
    }

    it("subclass respects direction passed to super constructor", () => {
        const seq = Tyneq.from([1, 2, 3]).where((x) => x > 1).select((x) => x * 2);
        const collector = new DirectionalCollector(undefined, "terminal-to-source");
        collector.visit(seq[tyneqQueryNode]!);
        expect(collector.names).toEqual(["select", "where", "from"]);
    });
});
