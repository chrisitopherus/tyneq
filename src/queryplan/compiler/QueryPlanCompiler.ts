import { TyneqSequence } from "../../types/core";
import { QueryPlanNode } from "../../types/queryplan";
import { QueryPlanTransformer } from "../QueryPlanTransformer";
import { Tyneq } from "../../core/tyneq";
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
     * @param node - The root node of the query plan to compile.
     * @returns The compiled sequence typed as `TyneqSequence<T>` by default.
     * If you know the plan ends in an operator that returns a subtype (e.g. `orderBy` →
     * `TyneqOrderedSequence`, `memoize` → `TyneqCachedSequence`), supply `TResult` explicitly:
     * `compiler.compile<number, TyneqOrderedSequence<number>>(node)`.
     */
    public compile<T = unknown, TResult extends TyneqSequence<T> = TyneqSequence<T>>(node: QueryPlanNode): TResult {
        const transformedNode = this.transform(node);
        return this.compileNode(transformedNode) as TResult;
    }

    private transform(node: QueryPlanNode): QueryPlanNode {
        let transformedNode = node;
        for (const transformer of this.transformers) {
            transformedNode = transformer.visit(transformedNode);
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
        console.log(node.operatorName);
        switch (node.operatorName) {
            case "from":
                return Tyneq.from(node.args[0] as Iterable<unknown>);
            case "range":
                return Tyneq.range(node.args[0] as number, node.args[1] as number);
            case "random":
                return Tyneq.random(node.args[0] as number, node.args[1] as () => unknown);
            case "empty":
                return Tyneq.empty();
            default:
                throw new CompilerError(
                    `Unknown source operator "${node.operatorName}". Built-in sources are: "from", "range", "random", "empty".`,
                    "source",
                    node.operatorName
                );
        }
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

        if (!(source instanceof entry.metadata.targetClass)) {
            const expected = entry.metadata.targetClass.name;
            const actual = (source as any)?.constructor?.name ?? typeof source;
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