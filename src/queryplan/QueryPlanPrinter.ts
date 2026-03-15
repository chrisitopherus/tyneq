import type { IQueryNode, IQueryPlanVisitor, QueryPlanPrinterOptions } from "../types/queryplan";

/**
 * A {@link IQueryPlanVisitor} that renders a query plan as a human-readable string.
 *
 * @remarks
 * `visit()` walks the `source` chain from the root source node to the terminal node,
 * rendering each operator as one indented line:
 *
 * ```
 * from([...3 items])
 *   → where(<fn>)
 *   → orderBy(<fn>)
 *   → select(<fn>)
 *   → take(5)
 * ```
 *
 * Lambda arguments are always rendered as `<fn>`. Override `formatArg` in a
 * subclass to customise argument rendering, or override `formatLine` to change
 * the full line structure.
 *
 * ```ts
 * const seq = Tyneq.from([1, 2, 3])
 *     .where(x => x > 1)
 *     .select(x => x * 2);
 *
 * QueryPlanPrinter.print(seq[tyneqQueryNode]!);                          // → console
 * const plan = QueryPlanPrinter.print(seq[tyneqQueryNode]!, { output: 'none' });
 * QueryPlanPrinter.print(seq[tyneqQueryNode]!, { output: './plan.txt' }); // → file
 * ```
 *
 * @group QueryPlan
 */
export class QueryPlanPrinter implements IQueryPlanVisitor<string> {
    protected readonly indent: string;
    protected readonly arrow: string;
    protected readonly maxInlineArrayItems: number;

    public constructor(options: QueryPlanPrinterOptions = {}) {
        this.indent = options.indent ?? "  ";
        this.arrow = options.arrow ?? "→";
        this.maxInlineArrayItems = options.maxInlineArrayItems ?? 3;
    }

    /**
     * Renders the query plan rooted at `node` and returns it as a string.
     *
     * @param node - The terminal (last) node in the chain; traversal walks to the root.
     * @returns The full human-readable query plan string.
     */
    public visit(node: IQueryNode): string {
        const result = this.buildPlan(node);
        return result;
    }

    /**
     * Convenience wrapper — constructs a printer with `options` and calls `visit(node)`.
     *
     * @param node    - The node to render.
     * @param options - Optional printer configuration.
     * @returns The rendered query plan string.
     */
    public static print(node: IQueryNode, options?: QueryPlanPrinterOptions): string {
        return new QueryPlanPrinter(options).visit(node);
    }

    // ── Template methods ────────────────────────────────────────────────────

    /**
     * Formats a single argument value for display.
     *
     * Override in a subclass to customise how specific argument types are rendered.
     *
     * Default rendering:
     * - `function`  → `<fn>`
     * - `null`      → `null`
     * - `undefined` → `undefined`
     * - `string`    → `"value"`
     * - `Array`     → `[a, b, c]` or `[...N items]` when longer than `maxInlineArrayItems`
     * - `object`    → `{...}`
     * - everything else → `String(arg)`
     *
     * @param arg - The raw argument value from {@link IQueryNode.args}.
     * @returns A display string for the argument.
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
     * Formats a single operator line.
     *
     * Override in a subclass to change the line structure — e.g., to include the
     * operator category or use a different separator.
     *
     * @param name   - The operator name (e.g., `'where'`, `'from'`).
     * @param argStr - Pre-formatted argument string (joined output of `formatArg`).
     * @param isRoot - `true` for the source node; `false` for all subsequent nodes.
     * @returns The formatted line string, without a trailing newline.
     */
    protected formatLine(name: string, argStr: string, isRoot: boolean): string {
        const prefix = isRoot ? "" : `${this.indent}${this.arrow} `;
        return `${prefix}${name}(${argStr})`;
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private buildPlan(node: IQueryNode): string {
        const nodes = this.collectNodes(node);
        const lines = nodes.map((n, index) => {
            const argStr = n.args.map((a) => this.formatArg(a)).join(", ");
            return this.formatLine(n.operatorName, argStr, index === 0);
        });
        return lines.join("\n");
    }

    /** Walks the `source` chain iteratively and returns nodes in root-to-leaf order. */
    private collectNodes(node: IQueryNode): IQueryNode[] {
        const nodes: IQueryNode[] = [];
        let current: IQueryNode | null = node;
        while (current !== null) {
            nodes.unshift(current);
            current = current.source;
        }
        return nodes;
    }
}
