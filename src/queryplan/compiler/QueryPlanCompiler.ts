import { TyneqSequence } from "../../types/core";
import { QueryPlanNode } from "../../types/queryplan";
import { QueryPlanTransformer } from "../QueryPlanTransformer";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { CompilerError } from "../../core/errors/CompilerError";

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
     * @returns The compiled sequence typed as `TyneqSequence<T>` by default.
     * If you know the plan ends in an operator that returns a subtype (e.g. `orderBy` ->
     * `TyneqOrderedSequence`, `memoize` -> `TyneqCachedSequence`), supply `TResult` explicitly:
     * `compiler.compile<number, TyneqOrderedSequence<number>>(node)`.
     */
    public compile<T = unknown, TResult extends TyneqSequence<T> = TyneqSequence<T>>(node: QueryPlanNode): TResult {
        if (node === null || node === undefined) {
            throw new CompilerError(
                "compile() received a null or undefined query plan node. Ensure the sequence was created via Tyneq.from(), Tyneq.range(), or another source operator before compiling.",
                "source"
            );
        }

        const transformedNode = this.transform(node);
        return this.compileNode(transformedNode) as TResult;
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
     */
    public compileRaw<T = unknown, TResult extends TyneqSequence<T> = TyneqSequence<T>>(node: QueryPlanNode): TResult {
        if (node === null || node === undefined) {
            throw new CompilerError(
                "compileRaw() received a null or undefined query plan node. Ensure the sequence was created via Tyneq.from(), Tyneq.range(), or another source operator before compiling.",
                "source"
            );
        }

        return this.compileNode(node) as TResult;
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

    private compileNode(node: QueryPlanNode): unknown {
        if (node.category === "source") {
            return this.compileSource(node);
        }

        if (node.source === null) {
            throw new CompilerError(
                "Operator node is missing a source node. Every operator node must have a source.",
                "operator",
                node.operatorName
            );
        }

        return this.applyOperator(this.compileNode(node.source), node);
    }

    private compileSource(node: QueryPlanNode): unknown {
        const entry = OperatorRegistry.get(node.operatorName);
        if (!entry || entry.metadata.kind !== "source") {
            throw new CompilerError(
                `Unknown source operator "${node.operatorName}". ` +
                "Register it via OperatorRegistry.registerSource() before compiling.",
                "source",
                node.operatorName
            );
        }

        return entry.impl.apply(null as never, [...node.args]);
    }

    private applyOperator(source: unknown, node: QueryPlanNode): unknown {
        const entry = OperatorRegistry.get(node.operatorName);

        if (!entry) {
            throw new CompilerError(
                `Operator "${node.operatorName}" is not registered. ` +
                "Register it via @operator, createOperator, or createGeneratorOperator before compiling.",
                "operator",
                node.operatorName
            );
        }

        if (entry.metadata.targetClass !== undefined && !(source instanceof entry.metadata.targetClass)) {
            const expected = entry.metadata.targetClass.name;
            const actual = source !== null && source !== undefined ? Object.getPrototypeOf(source)?.constructor?.name ?? typeof source : "null";
            throw new CompilerError(
                `Operator "${node.operatorName}" requires a ${expected} but received ${actual}. ` +
                "Ensure the source sequence is of the correct type for this operator.",
                "operator",
                node.operatorName
            );
        }

        return entry.impl.apply(source as never, [...node.args]);
    }
}