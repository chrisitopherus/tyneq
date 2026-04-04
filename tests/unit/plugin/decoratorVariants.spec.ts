/**
 * Tests for @operator, @terminal, @cachedOperator, @orderedOperator,
 * @cachedTerminal, @orderedTerminal decorators.
 *
 * All decorators register an operator via OperatorRegistry at class-evaluation time.
 * We verify: registration happened, the method is callable on the right sequence type,
 * validate fires eagerly, and the operator produces the expected result.
 */
import { afterEach, describe, expect, it } from "vitest";
import { Tyneq } from "../../../src/core/tyneq";
import { OperatorRegistry } from "../../../src/core/registry/TyneqOperatorRegistry";
import { ArgumentError } from "../../../src";
import { operator } from "../../../src/plugin/decorators/operator";
import { terminal } from "../../../src/plugin/decorators/terminal";
import { cachedOperator } from "../../../src/plugin/decorators/cachedOperator";
import { orderedOperator } from "../../../src/plugin/decorators/orderedOperator";
import { cachedTerminal } from "../../../src/plugin/decorators/cachedTerminal";
import { orderedTerminal } from "../../../src/plugin/decorators/orderedTerminal";
import { TyneqEnumerator } from "../../../src/core/enumerators/TyneqEnumerator";
import { TyneqCachedEnumerator } from "../../../src/core/enumerators/TyneqCachedEnumerator";
import { TyneqOrderedEnumerator } from "../../../src/core/enumerators/TyneqOrderedEnumerator";
import { TyneqTerminalOperator } from "../../../src/core/terminal/TyneqTerminalOperator";
import { TyneqCachedTerminalOperator } from "../../../src/core/terminal/TyneqCachedTerminalOperator";
import { TyneqOrderedTerminalOperator } from "../../../src/core/terminal/TyneqOrderedTerminalOperator";
import { TyneqCachedEnumerable } from "../../../src/core/TyneqCachedEnumerable";
import { TyneqOrderedEnumerable } from "../../../src/core/ordering/TyneqOrderedEnumerable";
import { Enumerator, Enumerable } from "../../../src/types/core";
import { PluginError } from "../../../src/core/errors/PluginError";

// --- @operator ---

describe("@operator", () => {
    afterEach(() => {
        OperatorRegistry.unregister("testOperatorDec");
        OperatorRegistry.unregister("testOperatorDecValidated");
        OperatorRegistry.unregister("testOperatorDecNoNext");
    });

    it("registers the operator under the given name", () => {
        @operator("testOperatorDec", "streaming")
        class TestStreamingEnumerator<T> extends TyneqEnumerator<T, T> {
            protected handleNext(): IteratorResult<T> {
                return this.sourceEnumerator.next();
            }
        }

        expect(OperatorRegistry.get("testOperatorDec")).toBeDefined();
    });

    it("registered metadata has the correct category", () => {
        @operator("testOperatorDec", "buffer")
        class TestStreamingEnumerator2<T> extends TyneqEnumerator<T, T> {
            protected handleNext(): IteratorResult<T> {
                return this.sourceEnumerator.next();
            }
        }

        expect(OperatorRegistry.get("testOperatorDec")?.metadata.kind).toBe("buffer");
    });

    it("the registered operator passes through all elements when no filtering", () => {
        @operator("testOperatorDec", "streaming")
        class PassThroughEnumerator<T> extends TyneqEnumerator<T, T> {
            protected handleNext(): IteratorResult<T> {
                return this.sourceEnumerator.next();
            }
        }

        const result = (Tyneq.from([1, 2, 3]) as any).testOperatorDec().toArray();
        expect(result).toEqual([1, 2, 3]);
    });

    it("validate fires eagerly before iteration", () => {
        let validateCalled = false;
        @operator<[number]>("testOperatorDecValidated", "streaming", (n) => {
            validateCalled = true;
            if (n <= 0) throw new ArgumentError("n must be positive", "n");
        })
        class TestValidatedEnumerator<T> extends TyneqEnumerator<T, T> {
            public constructor(source: Enumerator<T>, private readonly _n: number) {
                super(source);
            }
            protected handleNext(): IteratorResult<T> {
                return this.sourceEnumerator.next();
            }
        }

        expect(() => (Tyneq.from([1]) as any).testOperatorDecValidated(-1)).toThrow(ArgumentError);
        expect(validateCalled).toBe(true);
    });

    it("throws PluginError when applied to a class without a handleNext() method", () => {
        expect(() => {
            @operator("testOperatorDecNoNext", "streaming")
            class MissingHandleNextClass {
                // deliberately no handleNext() method
            }
        }).toThrow(PluginError);
    });
});

// --- @terminal ---

describe("@terminal", () => {
    afterEach(() => {
        OperatorRegistry.unregister("testTerminalDec");
        OperatorRegistry.unregister("testTerminalDecValidated");
        OperatorRegistry.unregister("testTerminalDecNoProcess");
    });

    it("registers the terminal under the given name", () => {
        @terminal("testTerminalDec")
        class TestTerminalOp extends TyneqTerminalOperator<number, number> {
            public process(): number {
                return [...this.source].length;
            }
        }

        expect(OperatorRegistry.get("testTerminalDec")).toBeDefined();
    });

    it("registered metadata kind is terminal", () => {
        @terminal("testTerminalDec")
        class TestTerminalOp2 extends TyneqTerminalOperator<number, number> {
            public process(): number { return 0; }
        }

        expect(OperatorRegistry.get("testTerminalDec")?.metadata.kind).toBe("terminal");
    });

    it("terminal produces the correct result", () => {
        @terminal("testTerminalDec")
        class CountTerminal extends TyneqTerminalOperator<number, number> {
            public process(): number {
                return [...this.source].length;
            }
        }

        const result = (Tyneq.from([1, 2, 3, 4]) as any).testTerminalDec();
        expect(result).toBe(4);
    });

    it("validate fires eagerly before process()", () => {
        @terminal<[number]>("testTerminalDecValidated", (n) => {
            if (n < 0) throw new ArgumentError("n must be non-negative", "n");
        })
        class ValidatedTerminal extends TyneqTerminalOperator<number, number> {
            public constructor(source: Enumerable<number>, private readonly _n: number) {
                super(source);
            }
            public process(): number { return this._n; }
        }

        expect(() => (Tyneq.from([1]) as any).testTerminalDecValidated(-1)).toThrow(ArgumentError);
    });

    it("throws PluginError when applied to a class without a process() method", () => {
        expect(() => {
            // Cast to any: deliberately testing the structural guard on a class missing process()
            (terminal as any)("testTerminalDecNoProcess")(
                class MissingProcessClass { },
                {}
            );
        }).toThrow(PluginError);
    });
});

// --- @cachedOperator ---

describe("@cachedOperator", () => {
    afterEach(() => {
        OperatorRegistry.unregister("testCachedOp");
        OperatorRegistry.unregister("testCachedOpValidated");
    });

    it("registers the operator under the given name", () => {
        @cachedOperator("testCachedOp", "streaming")
        class TestCachedEnumerator<T> extends TyneqCachedEnumerator<T> {
            protected handleNext(): IteratorResult<T> {
                return this.cachedSource.getEnumerator().next();
            }
        }

        expect(OperatorRegistry.get("testCachedOp")).toBeDefined();
    });

    it("registered metadata has the correct category", () => {
        @cachedOperator("testCachedOp", "buffer")
        class TestCachedEnumerator2<T> extends TyneqCachedEnumerator<T> {
            protected handleNext(): IteratorResult<T> {
                return this.cachedSource.getEnumerator().next();
            }
        }

        const entry = OperatorRegistry.get("testCachedOp");
        expect(entry?.metadata.kind).toBe("buffer");
    });

    it("validate fires before constructing the enumerator", () => {
        let validateCalled = false;

        @cachedOperator<[number]>("testCachedOpValidated", "streaming", (n) => {
            validateCalled = true;
            if (n <= 0) throw new ArgumentError("n must be positive", "n");
        })
        class TestValidatedCachedEnumerator<T> extends TyneqCachedEnumerator<T> {
            protected handleNext(): IteratorResult<T> {
                return this.cachedSource.getEnumerator().next();
            }
        }

        const cached = Tyneq.from([1, 2, 3]).memoize();
        expect(() => (cached as any).testCachedOpValidated(-1)).toThrow(ArgumentError);
        expect(validateCalled).toBe(true);
    });
});

// --- @orderedOperator ---

describe("@orderedOperator", () => {
    afterEach(() => {
        OperatorRegistry.unregister("testOrderedOp");
        OperatorRegistry.unregister("testOrderedOpValidated");
    });

    it("registers the operator under the given name", () => {
        @orderedOperator("testOrderedOp", "buffer")
        class TestOrderedEnumerator<T> extends TyneqOrderedEnumerator<T> {
            protected handleNext(): IteratorResult<T> {
                return this.orderedSource.getEnumerator().next();
            }
        }

        expect(OperatorRegistry.get("testOrderedOp")).toBeDefined();
    });

    it("registered metadata has the correct category", () => {
        @orderedOperator("testOrderedOp", "streaming")
        class TestOrderedEnumerator2<T> extends TyneqOrderedEnumerator<T> {
            protected handleNext(): IteratorResult<T> {
                return this.orderedSource.getEnumerator().next();
            }
        }

        expect(OperatorRegistry.get("testOrderedOp")?.metadata.kind).toBe("streaming");
    });

    it("validate fires eagerly on invalid arg", () => {
        @orderedOperator<[unknown]>("testOrderedOpValidated", "buffer", (selector) => {
            if (typeof selector !== "function") throw new ArgumentError("selector must be a function", "selector");
        })
        class TestOrderedOpValidated<T> extends TyneqOrderedEnumerator<T> {
            protected handleNext(): IteratorResult<T> {
                return this.orderedSource.getEnumerator().next();
            }
        }

        const ordered = Tyneq.from([3, 1, 2]).orderBy((x) => x);
        expect(() => (ordered as any).testOrderedOpValidated("not-a-function")).toThrow(ArgumentError);
    });
});

// --- @cachedTerminal ---

describe("@cachedTerminal", () => {
    afterEach(() => {
        OperatorRegistry.unregister("testCachedTerminal");
        OperatorRegistry.unregister("testCachedTerminalValidated");
    });

    it("registers the terminal under the given name", () => {
        @cachedTerminal("testCachedTerminal")
        class TestCachedTerminalOp extends TyneqCachedTerminalOperator<number, number> {
            public process(): number {
                return [...this.source].length;
            }
        }

        expect(OperatorRegistry.get("testCachedTerminal")).toBeDefined();
    });

    it("terminal produces the correct result on a cached sequence", () => {
        @cachedTerminal("testCachedTerminal")
        class CacheSizeOp extends TyneqCachedTerminalOperator<number, number> {
            public process(): number {
                return [...this.source].length;
            }
        }

        const cached = Tyneq.from([1, 2, 3, 4]).memoize();
        expect((cached as any).testCachedTerminal()).toBe(4);
    });

    it("validate fires eagerly on invalid arg", () => {
        @cachedTerminal<[number]>("testCachedTerminalValidated", (n) => {
            if (n <= 0) throw new ArgumentError("n must be positive", "n");
        })
        class TestCachedTerminalValidated extends TyneqCachedTerminalOperator<number, number> {
            private readonly n: number;
            public constructor(source: CachedEnumerable<number>, n: number) {
                super(source);
                this.n = n;
            }
            public process(): number {
                return this.n;
            }
        }

        const cached = Tyneq.from([1]).memoize();
        expect(() => (cached as any).testCachedTerminalValidated(-1)).toThrow(ArgumentError);
    });
});

// --- @orderedTerminal ---

describe("@orderedTerminal", () => {
    afterEach(() => {
        OperatorRegistry.unregister("testOrderedTerminal");
        OperatorRegistry.unregister("testOrderedTerminalValidated");
    });

    it("registers the terminal under the given name", () => {
        @orderedTerminal("testOrderedTerminal")
        class TestOrderedTerminalOp extends TyneqOrderedTerminalOperator<number, number> {
            public process(): number {
                return [...this.source].length;
            }
        }

        expect(OperatorRegistry.get("testOrderedTerminal")).toBeDefined();
    });

    it("terminal produces the correct result on an ordered sequence", () => {
        @orderedTerminal("testOrderedTerminal")
        class OrderedCountOp extends TyneqOrderedTerminalOperator<number, number> {
            public process(): number {
                return [...this.source].length;
            }
        }

        const ordered = Tyneq.from([3, 1, 2]).orderBy((x) => x);
        expect((ordered as any).testOrderedTerminal()).toBe(3);
    });

    it("validate fires eagerly on invalid arg", () => {
        @orderedTerminal<[number]>("testOrderedTerminalValidated", (limit) => {
            if (limit < 0) throw new ArgumentError("limit must be non-negative", "limit");
        })
        class TestOrderedTerminalValidated extends TyneqOrderedTerminalOperator<number, number> {
            private readonly limit: number;
            public constructor(source: OrderedEnumerable<number>, limit: number) {
                super(source);
                this.limit = limit;
            }
            public process(): number {
                return this.limit;
            }
        }

        const ordered = Tyneq.from([1, 2]).orderBy((x) => x);
        expect(() => (ordered as any).testOrderedTerminalValidated(-5)).toThrow(ArgumentError);
    });
});

// Type aliases for readability in test constructors
type CachedEnumerable<T> = InstanceType<typeof TyneqCachedEnumerable<T>>;
type OrderedEnumerable<T> = InstanceType<typeof TyneqOrderedEnumerable<T, unknown>>;
