import { TyneqSequence, SequenceConstructor } from "../../types/core";
import { QueryPlanNode } from "../../types/queryplan";
import { QueryPlanTransformer } from "../QueryPlanTransformer";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { CompilerError } from "../../core/errors/CompilerError";

/**
 * Options for {@link QueryPlanCompiler.compile} and {@link QueryPlanCompiler.compileRaw}.
 *
 * @group QueryPlan
 */
export interface CompileOptions {
    /**
     * Replaces the source data when compiling.
     *
     * When provided, the compiler passes this value as the first argument to the source
     * operator instead of the value stored in the plan node's `args`. This lets you reuse
     * the same pipeline structure (operators, predicates, projections) against a different
     * data set without rebuilding the sequence.
     *
     * @example
     * ```ts
     * const plan = Tyneq.from([1, 2, 3]).where(x => x > 1).select(x => x * 2)[tyneqQueryNode]!;
     * const compiler = new QueryPlanCompiler();
     *
     * compiler.compile(plan).toArray();                         // -> [4, 6]
     * compiler.compile(plan, { source: [10, 20, 30] }).toArray(); // -> [40, 60]
     * ```
     *
     * @remarks
     * Only applicable when the plan's source node is `from` - the only built-in source
     * operator whose first argument is the iterable data itself. Every other source
     * (`range`, `random`, `repeat`, `generate`, ...) takes non-iterable arguments
     * (counts, seeds, factories) as `args[0]`, so blindly substituting there would silently
     * produce nonsense (e.g. `range`'s `count` replaced by an array). Using `options.source`
     * against a non-`from` source node throws a {@link CompilerError} instead.
     *
     * Custom source operators registered via `OperatorRegistry.registerSource()` cannot opt
     * in to this option, even if their first argument happens to be iterable - there is
     * currently no metadata flag for a source to declare itself substitutable. Build a
     * fresh plan (or a new source node) instead if you need this for a custom source.
     */
    readonly source?: Iterable<unknown>;
}

/**
 * Compiles a query plan tree into an executable `TyneqSequence`.
 *
 * @remarks
 * Walks the `QueryPlanNode` chain from source to terminal, reconstructing each operator by
 * looking it up in the `OperatorRegistry` and applying it to the compiled source.
 * An optional list of `QueryPlanTransformer` instances runs before compilation, allowing
 * optimization or rewriting of the plan.
 *
 * @example
 * ```ts
 * import { Tyneq, tyneqQueryNode, QueryPlanCompiler, QueryPlanOptimizer } from "tyneq";
 *
 * const seq = Tyneq.from([1, 2, 3]).where(x => x > 1).select(x => x * 2);
 * const compiler = new QueryPlanCompiler([new QueryPlanOptimizer()]);
 * const result = compiler.compile(seq[tyneqQueryNode]!);
 * result.toArray(); // -> [4, 6]
 * ```
 *
 * @group QueryPlan
 */
export class QueryPlanCompiler {
    private readonly transformers: QueryPlanTransformer[];

    public constructor(transformers: Iterable<QueryPlanTransformer> = []) {
        this.transformers = [...transformers];
    }

    /**
     * Compile a query plan into an executable sequence.
     *
     * Runs all registered transformers before compiling. Use {@link compileRaw} to skip
     * the transform phase when the plan is already optimised.
     *
     * @param node - The root node of the query plan to compile.
     * @param options - Optional compile-time overrides. Use `options.source` to supply a
     * different data source than the one stored in the plan.
     * @returns The compiled sequence typed as `TyneqSequence<T>` by default.
     * If you know the plan ends in an operator that returns a subtype (e.g. `orderBy` ->
     * `TyneqOrderedSequence`, `memoize` -> `TyneqCachedSequence`), supply `TResult` explicitly:
     * `compiler.compile<number, TyneqOrderedSequence<number>>(node)`.
     */
    public compile<T = unknown, TResult extends TyneqSequence<T> = TyneqSequence<T>>(node: QueryPlanNode, options?: CompileOptions): TResult {
        if (node === null || node === undefined) {
            throw new CompilerError(
                "compile() received a null or undefined query plan node. Ensure the sequence was created via Tyneq.from(), Tyneq.range(), or another source operator before compiling.",
                "source"
            );
        }

        const transformedNode = this.transform(node);
        return this.compileNode(transformedNode, options) as TResult;
    }

    /**
     * Compile a pre-optimised query plan into an executable sequence, skipping the
     * transform phase.
     *
     * @remarks
     * Use this overload when you have already run transformers externally (or deliberately
     * want to bypass them) and want to compile the node as-is. Equivalent to constructing
     * a `QueryPlanCompiler` with no transformers and calling `compile()`.
     *
     * @param node - The root node of the already-transformed query plan to compile.
     * @param options - Optional compile-time overrides. Use `options.source` to supply a
     * different data source than the one stored in the plan.
     */
    public compileRaw<T = unknown, TResult extends TyneqSequence<T> = TyneqSequence<T>>(node: QueryPlanNode, options?: CompileOptions): TResult {
        if (node === null || node === undefined) {
            throw new CompilerError(
                "compileRaw() received a null or undefined query plan node. Ensure the sequence was created via Tyneq.from(), Tyneq.range(), or another source operator before compiling.",
                "source"
            );
        }

        return this.compileNode(node, options) as TResult;
    }

    private transform(node: QueryPlanNode): QueryPlanNode {
        let transformedNode = node;
        for (const transformer of this.transformers) {
            try {
                transformedNode = transformer.visit(transformedNode);
            } catch (e) {
                throw new CompilerError(
                    `Transformer "${(transformer as { constructor: { name: string } }).constructor.name}" threw during transformation.`,
                    "transform",
                    undefined,
                    e instanceof Error ? e : undefined
                );
            }
        }

        return transformedNode;
    }

    private compileNode(node: QueryPlanNode, options?: CompileOptions): unknown {
        if (node.category === "source") {
            return this.compileSource(node, options);
        }

        if (node.source === null) {
            throw new CompilerError(
                "Operator node is missing a source node. Every operator node must have a source.",
                "operator",
                node.operatorName
            );
        }

        return this.applyOperator(this.compileNode(node.source, options), node);
    }

    private compileSource(node: QueryPlanNode, options?: CompileOptions): unknown {
        const entry = OperatorRegistry.getSource(node.operatorName);
        if (!entry) {
            throw new CompilerError(
                `Unknown source operator "${node.operatorName}". ` +
                "Register it via OperatorRegistry.registerSource() before compiling.",
                "source",
                node.operatorName
            );
        }

        let args: unknown[];
        if (options?.source !== undefined) {
            if (node.operatorName !== "from") {
                throw new CompilerError(
                    `options.source is not applicable to source operator "${node.operatorName}" - ` +
                    "only \"from\" takes the iterable data as its first argument. " +
                    "Every other source operator takes non-iterable arguments (counts, seeds, " +
                    "factories) as args[0], so substituting here would produce incorrect results. " +
                    "Build a new plan with the desired arguments instead of using options.source here.",
                    "source",
                    node.operatorName
                );
            }

            args = [options.source, ...node.args.slice(1)];
        } else {
            args = [...node.args];
        }

        return entry.impl.apply(null as never, args);
    }

    private applyOperator(source: unknown, node: QueryPlanNode): unknown {
        const entry = this.findOperatorEntry(node.operatorName, source);

        if (!entry) {
            const sourceType = source !== null && source !== undefined
                ? Object.getPrototypeOf(source)?.constructor?.name ?? typeof source
                : "null";
            const knownForAnyTarget = OperatorRegistry.hasOperator(node.operatorName);
            const message = knownForAnyTarget
                ? `Operator "${node.operatorName}" is not registered for sequence type ${sourceType}. ` +
                  "Ensure the source sequence is of the correct type for this operator."
                : `Operator "${node.operatorName}" is not registered. ` +
                  "Register it via @operator, createOperator, or createGeneratorOperator before compiling.";
            throw new CompilerError(message, "operator", node.operatorName);
        }

        return entry.impl.apply(source as never, [...node.args]);
    }

    // Walk the prototype chain of source to find the most-specific registered entry.
    private findOperatorEntry(operatorName: string, source: unknown): ReturnType<typeof OperatorRegistry.getOperator> {
        if (source === null || source === undefined) {
            return undefined;
        }

        let proto = Object.getPrototypeOf(source) as object | null;
        while (proto !== null) {
            const ctor = (proto as { constructor?: SequenceConstructor }).constructor;
            if (ctor !== undefined) {
                const entry = OperatorRegistry.getOperator(operatorName, ctor);
                if (entry !== undefined) {
                    return entry;
                }
            }

            proto = Object.getPrototypeOf(proto) as object | null;
        }

        return undefined;
    }
}