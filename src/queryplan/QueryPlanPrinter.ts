import type { IQueryNode } from './IQueryNode';
import type { IQueryPlanVisitor } from './IQueryPlanVisitor';

/**
 * Output destination for {@link QueryPlanPrinter}.
 *
 * - `'console'` — writes the result to `console.log` (default).
 * - `'none'`    — no side-effect output; the string is only returned by `visit()`.
 * - A file-system path string — overwrites the file with the result.
 *
 * @group QueryPlan
 */
export type QueryPlanPrinterOutput = 'console' | 'none' | string;

/**
 * Options for {@link QueryPlanPrinter}.
 *
 * @group QueryPlan
 */
export interface QueryPlanPrinterOptions {
    /**
     * Where to send the output in addition to returning it.
     * - `'console'` (default) — logs via `console.log`.
     * - `'none'`              — no side effects; string is only returned.
     * - A file path           — overwrites the file with the result.
     */
    output?: QueryPlanPrinterOutput;

    /**
     * String prepended before the arrow on each non-root operator line.
     * Default: `'  '` (two spaces).
     */
    indent?: string;

    /**
     * Arrow symbol placed between the indent and the operator name on non-root lines.
     * Default: `'→'`.
     */
    arrow?: string;

    /**
     * Maximum number of array elements to inline before summarising as `[...N items]`.
     * Default: `3`.
     */
    maxInlineArrayItems?: number;
}

/**
 * A {@link IQueryPlanVisitor} that renders a query plan as a human-readable string
 * and optionally writes it to the console or a file.
 *
 * @remarks
 * `visit()` walks the `source` chain from the root source node to the terminal node
 * and renders each operator as one line:
 *
 * ```
 * from([...3 items])
 *   → where(<fn>)
 *   → orderBy(<fn>)
 *   → thenBy(<fn>)
 *   → select(<fn>)
 *   → take(5)
 * ```
 *
 * ## Output targets
 *
 * | `output` value | Behaviour |
 * |---|---|
 * | `'console'` (default) | Calls `console.log(result)` after building the string |
 * | `'none'` | No side effect; only the string is returned |
 * | File path (e.g. `'./plan.txt'`) | Overwrites the file with the result |
 *
 * ## Function arguments
 *
 * Lambda arguments are always rendered as `<fn>` because functions are not
 * serialisable. Override {@link formatArg} in a subclass to customise rendering.
 *
 * ## Custom rendering
 *
 * Override {@link formatArg} to change how individual argument values are displayed,
 * or override {@link formatLine} to change the full line structure (prefix, arrow,
 * operator name, argument string).
 *
 * ## Usage
 *
 * ```ts
 * import { QueryPlanPrinter } from 'tyneq';
 *
 * const seq = Tyneq.from([1, 2, 3])
 *     .where(x => x > 1)
 *     .select(x => x * 2);
 *
 * // Print to console (default):
 * QueryPlanPrinter.print(seq.queryNode!);
 *
 * // Capture as string without printing:
 * const plan = QueryPlanPrinter.print(seq.queryNode!, { output: 'none' });
 *
 * // Write to a file:
 * QueryPlanPrinter.print(seq.queryNode!, { output: './query-plan.txt' });
 * ```
 *
 * @group QueryPlan
 */
export class QueryPlanPrinter implements IQueryPlanVisitor<string> {
    private readonly output: QueryPlanPrinterOutput;
    protected readonly indent: string;
    protected readonly arrow: string;
    protected readonly maxInlineArrayItems: number;

    public constructor(options: QueryPlanPrinterOptions = {}) {
        this.output = options.output ?? 'console';
        this.indent = options.indent ?? '  ';
        this.arrow = options.arrow ?? '→';
        this.maxInlineArrayItems = options.maxInlineArrayItems ?? 3;
    }

    /**
     * Builds the query plan string from `node` and sends it to the configured output.
     *
     * @param node - The terminal (last) node in the chain; traversal walks to the root.
     * @returns The full human-readable query plan string.
     */
    public visit(node: IQueryNode): string {
        const result = this.buildPlan(node);
        return result;
    }

    /**
     * Creates a printer with `options`, calls `visit(node)`, and returns the result.
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
     * Override in a subclass to customise how specific argument types are rendered
     * (e.g., to include a function's name, or summarise complex objects).
     *
     * Default rendering:
     * - `function` → `<fn>`
     * - `null`     → `null`
     * - `undefined`→ `undefined`
     * - `string`   → `"value"`
     * - `Array`    → `[a, b, c]` or `[...N items]` when longer than `maxInlineArrayItems`
     * - `object`   → `{...}`
     * - everything else → `String(arg)`
     *
     * @param arg - The raw argument value from {@link IQueryNode.args}.
     * @returns A display string for the argument.
     */
    protected formatArg(arg: unknown): string {
        if (typeof arg === 'function') return '<fn>';
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'string') return `"${arg}"`;
        if (Array.isArray(arg)) {
            if (arg.length === 0) return '[]';
            if (arg.length <= this.maxInlineArrayItems) {
                return `[${arg.map(a => this.formatArg(a)).join(', ')}]`;
            }
            return `[...${arg.length} items]`;
        }
        if (typeof arg === 'object') return '{...}';
        return String(arg);
    }

    /**
     * Formats a single operator line.
     *
     * Override in a subclass to change the line structure — e.g., to add
     * the operator category, change the indentation symbol, or use a
     * different separator between root and non-root lines.
     *
     * @param name   - The operator name (e.g., `'where'`, `'from'`).
     * @param argStr - The pre-formatted argument string (output of joining `formatArg` results).
     * @param isRoot - `true` for the first (source) node in the chain; `false` for all others.
     * @returns The formatted line string, without a trailing newline.
     */
    protected formatLine(name: string, argStr: string, isRoot: boolean): string {
        const prefix = isRoot ? '' : `${this.indent}${this.arrow} `;
        return `${prefix}${name}(${argStr})`;
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private buildPlan(node: IQueryNode): string {
        const nodes = this.collectNodes(node);
        const lines = nodes.map((n, index) => {
            const argStr = n.args.map(a => this.formatArg(a)).join(', ');
            return this.formatLine(n.operatorName, argStr, index === 0);
        });
        return lines.join('\n');
    }

    /**
     * Walks the `source` chain iteratively and returns nodes in root-to-leaf order.
     */
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
