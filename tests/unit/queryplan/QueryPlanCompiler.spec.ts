import { afterEach, describe, expect, it } from "vitest";
import {
    Tyneq,
    tyneqQueryNode,
    QueryPlanCompiler,
    QueryPlanTransformer,
    QueryPlanOptimizer,
    QueryNode,
    CompilerError,
    OperatorRegistry,
    OperatorMetadata,
    type CompileOptions,
} from "../../../src";
import type { IQueryNode } from "../../../src";

const UID = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
let counter = 0;
const nextName = (): string => `__compilerSpec_${UID}_${counter++}`;
const registered: string[] = [];

afterEach(() => {
    for (const name of registered.splice(0)) {
        OperatorRegistry.unregister(name);
    }
});

describe("QueryPlanCompiler", () => {
    describe("compile() — basic pipelines", () => {
        it("compiles a simple from -> where -> select plan", () => {
            const seq = Tyneq.from([1, 2, 3, 4, 5])
                .where((x) => x > 2)
                .select((x) => x * 10);

            const node = seq[tyneqQueryNode]!;
            const result = new QueryPlanCompiler().compile<number>(node);
            expect(result.toArray()).toEqual([30, 40, 50]);
        });

        it("compiles a range source", () => {
            const seq = Tyneq.range(1, 4);
            const node = seq[tyneqQueryNode]!;
            const result = new QueryPlanCompiler().compile<number>(node);
            expect(result.toArray()).toEqual([1, 2, 3, 4]);
        });

        it("compiles an empty source", () => {
            const seq = Tyneq.empty<number>();
            const node = seq[tyneqQueryNode]!;
            const result = new QueryPlanCompiler().compile<number>(node);
            expect(result.toArray()).toEqual([]);
        });

        it("compiles a plain from source", () => {
            const seq = Tyneq.from([10, 20, 30]);
            const node = seq[tyneqQueryNode]!;
            const result = new QueryPlanCompiler().compile<number>(node);
            expect(result.toArray()).toEqual([10, 20, 30]);
        });

        it("compiles a random source", () => {
            const seq = Tyneq.random(5, () => 1);
            const node = seq[tyneqQueryNode]!;
            const result = new QueryPlanCompiler().compile<number>(node);
            expect(result.toArray()).toHaveLength(5);
        });

        it("compiled result is re-iterable", () => {
            const seq = Tyneq.from([1, 2, 3]).where((x) => x > 1);
            const node = seq[tyneqQueryNode]!;
            const compiled = new QueryPlanCompiler().compile<number>(node);
            expect(compiled.toArray()).toEqual([2, 3]);
            expect(compiled.toArray()).toEqual([2, 3]);
        });
    });

    describe("compile() — null/undefined guard", () => {
        it("throws CompilerError when node is null", () => {
            expect(() => new QueryPlanCompiler().compile(null as unknown as IQueryNode)).toThrowError(CompilerError);
        });

        it("throws CompilerError when node is undefined", () => {
            expect(() => new QueryPlanCompiler().compile(undefined as unknown as IQueryNode)).toThrowError(CompilerError);
        });

        it("null node error has phase 'source'", () => {
            let caught: CompilerError | undefined;
            try {
                new QueryPlanCompiler().compile(null as unknown as IQueryNode);
            } catch (e) {
                caught = e as CompilerError;
            }

            expect(caught?.phase).toBe("source");
        });
    });

    describe("compile() — unknown source operator", () => {
        it("throws CompilerError with phase 'source' for unknown source name", () => {
            const node = new QueryNode("customSource", [], null, "source");
            let caught: CompilerError | undefined;
            try {
                new QueryPlanCompiler().compile(node);
            } catch (e) {
                caught = e as CompilerError;
            }

            expect(caught).toBeInstanceOf(CompilerError);
            expect(caught?.phase).toBe("source");
            expect(caught?.operatorName).toBe("customSource");
        });
    });

    describe("compile() — third-party source via registerSource()", () => {
        it("compiles a custom source operator registered via registerSource()", () => {
            const name = nextName();
            registered.push(name);
            OperatorRegistry.registerSource(name, (items) => Tyneq.from(items as number[]), "external");

            const node = new QueryNode(name, [[10, 20, 30]], null, "source");
            const result = new QueryPlanCompiler().compile<number>(node);
            expect(result.toArray()).toEqual([10, 20, 30]);
        });
    });

    describe("compile() — orphaned operator node (missing source)", () => {
        it("throws CompilerError with phase 'operator' for operator node with null source", () => {
            const orphan = new QueryNode("where", [() => true], null, "streaming");
            let caught: CompilerError | undefined;
            try {
                new QueryPlanCompiler().compile(orphan);
            } catch (e) {
                caught = e as CompilerError;
            }

            expect(caught).toBeInstanceOf(CompilerError);
            expect(caught?.phase).toBe("operator");
        });
    });

    describe("compile() — unregistered operator in plan", () => {
        it("throws CompilerError with phase 'operator' and correct operatorName", () => {
            const source = new QueryNode("from", [[1, 2]], null, "source");
            const op = new QueryNode("nonExistentOp", [], source, "streaming");
            let caught: CompilerError | undefined;
            try {
                new QueryPlanCompiler().compile(op);
            } catch (e) {
                caught = e as CompilerError;
            }

            expect(caught).toBeInstanceOf(CompilerError);
            expect(caught?.phase).toBe("operator");
            expect(caught?.operatorName).toBe("nonExistentOp");
        });
    });

    describe("compile() — instanceof mismatch error", () => {
        it("throws CompilerError with phase 'operator' when source type doesn't match targetClass", () => {
            // Register an operator whose targetClass is a class that no sequence can be instanceof
            class SentinelClass { }

            const name = nextName();
            registered.push(name);
            OperatorRegistry.register({
                metadata: new OperatorMetadata(name, "streaming", "external", SentinelClass as never),
                impl: function () { return null as never; },
            });

            const source = new QueryNode("from", [[1]], null, "source");
            const op = new QueryNode(name, [], source, "streaming");
            let caught: CompilerError | undefined;
            try {
                new QueryPlanCompiler().compile(op);
            } catch (e) {
                caught = e as CompilerError;
            }

            expect(caught).toBeInstanceOf(CompilerError);
            expect(caught?.phase).toBe("operator");
            expect(caught?.operatorName).toBe(name);
        });
    });

    describe("compile() — with transformer", () => {
        it("applies a transformer before compiling", () => {
            let visited = false;
            class TrackingTransformer extends QueryPlanTransformer {
                protected override transformNode(node: IQueryNode, source: IQueryNode | null): IQueryNode {
                    visited = true;
                    return super.transformNode(node, source);
                }
            }

            const seq = Tyneq.from([1, 2, 3]).where((x) => x > 1);
            const node = seq[tyneqQueryNode]!;
            const result = new QueryPlanCompiler([new TrackingTransformer()]).compile<number>(node);
            expect(visited).toBe(true);
            expect(result.toArray()).toEqual([2, 3]);
        });

        it("wraps transformer errors in CompilerError with phase 'transform'", () => {
            class BoomTransformer extends QueryPlanTransformer {
                public override visit(_node: IQueryNode): IQueryNode {
                    throw new Error("transformer exploded");
                }
            }

            const seq = Tyneq.from([1]).where((x) => x > 0);
            const node = seq[tyneqQueryNode]!;
            let caught: CompilerError | undefined;
            try {
                new QueryPlanCompiler([new BoomTransformer()]).compile(node);
            } catch (e) {
                caught = e as CompilerError;
            }

            expect(caught).toBeInstanceOf(CompilerError);
            expect(caught?.phase).toBe("transform");
            expect(caught?.message).toContain("BoomTransformer");
        });

        it("preserves inner error from transformer throw", () => {
            const inner = new Error("inner cause");
            class InnerErrorTransformer extends QueryPlanTransformer {
                public override visit(_node: IQueryNode): IQueryNode {
                    throw inner;
                }
            }

            const seq = Tyneq.from([1]);
            const node = seq[tyneqQueryNode]!;
            let caught: CompilerError | undefined;
            try {
                new QueryPlanCompiler([new InnerErrorTransformer()]).compile(node);
            } catch (e) {
                caught = e as CompilerError;
            }

            expect(caught?.inner).toBe(inner);
        });
    });

    describe("compile() — with QueryPlanOptimizer", () => {
        it("applies optimizer fusions and produces correct result", () => {
            const seq = Tyneq.from([1, 2, 3, 4, 5])
                .where((x) => x > 1)
                .where((x) => x < 5)
                .select((x) => x * 2)
                .select((x) => x + 1);

            const node = seq[tyneqQueryNode]!;
            const result = new QueryPlanCompiler([new QueryPlanOptimizer()]).compile<number>(node);
            expect(result.toArray()).toEqual([5, 7, 9]);
        });
    });

    describe("compile() — source override via CompileOptions", () => {
        it("uses the override source instead of the stored source data", () => {
            const plan = Tyneq.from([1, 2, 3])
                .where((x: number) => x > 1)
                .select((x: number) => x * 10)[tyneqQueryNode]!;

            // override with [0, 2, 4]: where(x > 1) keeps 2 and 4, select(*10) -> [20, 40]
            const result = new QueryPlanCompiler().compile<number>(plan, { source: [0, 2, 4] });
            expect(result.toArray()).toEqual([20, 40]);
        });

        it("ignores the override when source is undefined (uses stored data)", () => {
            const plan = Tyneq.from([1, 2, 3]).where((x: number) => x > 1)[tyneqQueryNode]!;

            const options: CompileOptions = {};
            const result = new QueryPlanCompiler().compile<number>(plan, options);
            expect(result.toArray()).toEqual([2, 3]);
        });

        it("preserves all operators when overriding source", () => {
            const plan = Tyneq.from([5, 3, 1, 4, 2])
                .where((x: number) => x > 2)
                .select((x: number) => x * 2)[tyneqQueryNode]!;

            const result = new QueryPlanCompiler().compile<number>(plan, { source: [10, 1, 8, 2, 6] });
            expect(result.toArray()).toEqual([20, 16, 12]);
        });

        it("original plan is unaffected after compiling with override", () => {
            const seq = Tyneq.from([1, 2, 3]).where((x: number) => x > 1);
            const plan = seq[tyneqQueryNode]!;
            const compiler = new QueryPlanCompiler();

            compiler.compile<number>(plan, { source: [10, 20] });
            expect(compiler.compile<number>(plan).toArray()).toEqual([2, 3]);
        });

        it("works with compileRaw and source override", () => {
            const plan = Tyneq.from([1, 2, 3]).select((x: number) => x + 1)[tyneqQueryNode]!;

            const result = new QueryPlanCompiler().compileRaw<number>(plan, { source: [100, 200] });
            expect(result.toArray()).toEqual([101, 201]);
        });
    });

    describe("compileRaw()", () => {
        it("compiles a plan without running transformers", () => {
            let transformerCalled = false;
            class SpyTransformer extends QueryPlanTransformer {
                protected override transformNode(node: IQueryNode, source: IQueryNode | null): IQueryNode {
                    transformerCalled = true;
                    return super.transformNode(node, source);
                }
            }

            const seq = Tyneq.from([1, 2, 3]).where((x) => x > 1);
            const node = seq[tyneqQueryNode]!;
            const result = new QueryPlanCompiler([new SpyTransformer()]).compileRaw<number>(node);
            expect(transformerCalled).toBe(false);
            expect(result.toArray()).toEqual([2, 3]);
        });

        it("throws CompilerError when node is null", () => {
            expect(() =>
                new QueryPlanCompiler().compileRaw(null as unknown as IQueryNode)
            ).toThrow(CompilerError);
        });

        it("throws CompilerError when node is undefined", () => {
            expect(() =>
                new QueryPlanCompiler().compileRaw(undefined as unknown as IQueryNode)
            ).toThrow(CompilerError);
        });

        it("null node error has phase 'source'", () => {
            let caught: CompilerError | undefined;
            try {
                new QueryPlanCompiler().compileRaw(null as unknown as IQueryNode);
            } catch (e) {
                caught = e as CompilerError;
            }

            expect(caught?.phase).toBe("source");
        });

        it("produces the same result as compile() on a plan with no transformers", () => {
            const seq = Tyneq.range(1, 5).select((x) => x * x);
            const node = seq[tyneqQueryNode]!;
            const compiler = new QueryPlanCompiler();
            expect(compiler.compileRaw<number>(node).toArray())
                .toEqual(compiler.compile<number>(node).toArray());
        });
    });
});
