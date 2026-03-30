import { TyneqSequence } from "../../types/core";
import { QueryPlanNode } from "../../types/queryplan";
import { QueryPlanTransformer } from "../QueryPlanTransformer";
import { Tyneq } from "../../core/tyneq";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";

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
            throw new Error("[tyneq] QueryPlanCompiler: operator node missing source");
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
                throw new Error(
                    `[tyneq] QueryPlanCompiler: unknown source operator '${node.operatorName}'`
                );
            }
        }
    }

    private applyOperator<T = unknown>(source: TyneqSequence<unknown>, node: QueryPlanNode): TyneqSequence<T> {
        if (!(source instanceof TyneqEnumerableBase)) {
            throw new Error(
                `[tyneq] QueryPlanCompiler: source sequence for operator '${node.operatorName}' is not a Tyneq sequence.`
            );
        }

        // if (!OperatorRegistry.has(node.operatorName)) {
        //     throw new Error(
        //         `[tyneq] QueryPlanCompiler: operator '${node.operatorName}' is not registered.`
        //     );
        // }

        const method2 = source[node.operatorName as keyof typeof source];
        if (typeof method2 !== "function") {
            throw new Error(
                `2[tyneq] QueryPlanCompiler: no operator '${node.operatorName}' on source sequence. Is the operator registered?`
            );
        }

        const method = OperatorRegistry.get(node.operatorName)?.impl;
        if (typeof method !== "function") {
            throw new Error(
                `[tyneq] QueryPlanCompiler: no operator '${node.operatorName}' on source sequence. Is the operator registered?`
            );
        }

        return method.apply(source, [...node.args]) as TyneqSequence<T>;
    }
}