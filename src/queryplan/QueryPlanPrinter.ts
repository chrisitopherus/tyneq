import type { QueryPlanNode, QueryPlanVisitor, QueryPlanPrinterOptions } from "../types/queryplan";
import type { Nullable } from "../types/utility";

/**
 * Converts a query plan tree into a human-readable multi-line string.
 *
 * Implements `QueryPlanVisitor<string>`. The output lists operators from source to
 * terminal, one per line, with indentation showing the pipeline depth.
 *
 * @example
 * ```ts
 * import { QueryPlanPrinter } from "tyneq/queryplan";
 *
 * const seq = Tyneq.range(1, 10).where(x => x % 2 === 0).select(x => x * x);
 * console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
 * // range(1, 10)
 * //   -> where(<fn>)
 * //   -> select(<fn>)
 * ```
 *
 * @group QueryPlan
 */
export class QueryPlanPrinter implements QueryPlanVisitor<string> {
    protected readonly indent: string;
    protected readonly arrow: string;
    protected readonly maxInlineArrayItems: number;

    public constructor(options: QueryPlanPrinterOptions = {}) {
        this.indent = options.indent ?? "  ";
        this.arrow = options.arrow ?? "->";
        this.maxInlineArrayItems = options.maxInlineArrayItems ?? 3;
    }

    /** Renders the full query plan rooted at `node` as a multi-line string. */
    public visit(node: QueryPlanNode): string {
        const result = this.buildPlan(node);
        return result;
    }

    /** Convenience static: creates a printer with `options` and calls `visit(node)`. */
    public static print(node: QueryPlanNode, options?: QueryPlanPrinterOptions): string {
        return new QueryPlanPrinter(options).visit(node);
    }

    /**
     * Formats a single operator argument for display.
     * Override to customise how arguments appear in printed plans.
     */
    protected formatArg(arg: unknown): string {
        if (typeof arg === "function") return "<fn>";
        if (arg === null) return "null";
        if (arg === undefined) return "undefined";
        if (typeof arg === "string") return `"${arg}"`;
        if (Array.isArray(arg)) {
            if (arg.length === 0) return "[]";
            if (arg.length <= this.maxInlineArrayItems) {
                return `[${arg.map((a) => this.formatArg(a)).join(", ")}]`;
            }

            return `[...${arg.length} items]`;
        }
        if (typeof arg === "object") return "{...}";

        return String(arg);
    }

    /**
     * Formats one line of the plan output.
     * Override to customise indentation or arrow style beyond what `QueryPlanPrinterOptions` allows.
     */
    protected formatLine(name: string, argStr: string, isRoot: boolean): string {
        const prefix = isRoot ? "" : `${this.indent}${this.arrow} `;
        return `${prefix}${name}(${argStr})`;
    }

    private buildPlan(node: QueryPlanNode): string {
        const nodes = this.collectNodes(node);
        const lines = nodes.map((n, index) => {
            const argStr = n.args.map((a) => this.formatArg(a)).join(", ");
            return this.formatLine(n.operatorName, argStr, index === 0);
        });
        return lines.join("\n");
    }

    
    private collectNodes(node: QueryPlanNode): QueryPlanNode[] {
        const nodes: QueryPlanNode[] = [];
        let current: Nullable<QueryPlanNode> = node;
        while (current !== null) {
            nodes.push(current);
            current = current.source;
        }

        nodes.reverse();

        return nodes;
    }
}
