import { TyneqSequence } from "../../types/core";
import { QueryPlanNode } from "../../types/queryplan";
import { QueryPlanTransformer } from "../QueryPlanTransformer";
import { Tyneq } from "../../core/tyneq";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { CompilerError } from "../../core/errors/CompilerError";

export class QueryPlanCompiler {
    private readonly transformers: QueryPlanTransformer[];

    public constructor(transformers: Iterable<QueryPlanTransformer> = []) {
        this.transformers = [...transformers];
    }

    /**
     * Compile a query plan into an executable sequence.
     * @param node - The root node of the query plan to compile.
     * @returns An executable sequence representing the compiled query plan.
     */
    public compile<T = unknown>(node: QueryPlanNode): TyneqSequence<T> {
        const transformedNode = this.transform(node);
        return this.compileNode<T>(transformedNode);
    }

    private transform(node: QueryPlanNode): QueryPlanNode {
        let transformedNode = node;
        for (const transformer of this.transformers) {
            transformedNode = transformer.visit(transformedNode);
        }

        return transformedNode;
    }

    private compileNode<T = unknown>(node: QueryPlanNode): TyneqSequence<T> {
        if (node.category === "source") {
            return this.compileSource(node) as TyneqSequence<T>;
        }

        if (node.source === null) {
            throw new CompilerError(
                "Operator node is missing a source node. Every operator node must have a source.",
                "operator",
                node.operatorName
            );
        }

        const sourceSeq = this.compileNode<T>(node.source);
        return this.applyOperator(sourceSeq, node) as TyneqSequence<T>;
    }

    private compileSource<T = unknown>(node: QueryPlanNode): TyneqSequence<T> {
        console.log(node.operatorName);
        switch (node.operatorName) {
            case "from":
                return Tyneq.from(node.args[0] as Iterable<T>);
            case "range":
                return Tyneq.range(node.args[0] as number, node.args[1] as number) as TyneqSequence<T>;
            case "random":
                return Tyneq.random(node.args[0] as number, node.args[1] as () => T);
            case "empty":
                return Tyneq.empty<T>();
            default: {
                throw new CompilerError(
                    `Unknown source operator "${node.operatorName}". Built-in sources are: "from", "range", "random", "empty".`,
                    "source",
                    node.operatorName
                );
            }
        }
    }

    private applyOperator<T = unknown>(source: TyneqSequence<unknown>, node: QueryPlanNode): TyneqSequence<T> {
        if (!(source instanceof TyneqEnumerableBase)) {
            throw new CompilerError(
                `The source sequence for operator "${node.operatorName}" is not a Tyneq sequence. ` +
                "Only sequences produced by Tyneq can be used as operator sources.",
                "operator",
                node.operatorName
            );
        }

        if (!OperatorRegistry.has(node.operatorName)) {
            throw new CompilerError(
                `Operator "${node.operatorName}" is not registered. ` +
                "Register it via @operator, createOperator, or createStreamingOperator before compiling.",
                "operator",
                node.operatorName
            );
        }

        const method = OperatorRegistry.get(node.operatorName)?.impl;
        if (typeof method !== "function") {
            throw new CompilerError(
                `Operator "${node.operatorName}" is registered but its implementation is not a function. ` +
                "This indicates a corrupt registry entry.",
                "operator",
                node.operatorName
            );
        }

        return method.apply(source, [...node.args]) as TyneqSequence<T>;
    }
}