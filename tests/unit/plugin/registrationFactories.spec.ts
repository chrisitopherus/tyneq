/**
 * Tests for createOrderedOperator, createCachedOperator,
 * createOrderedTerminalOperator, createCachedTerminalOperator.
 */
import { afterEach, describe, expect, it } from "vitest";
import { Tyneq } from "../../../src/core/tyneq";
import { OperatorRegistry } from "../../../src/core/registry/TyneqOperatorRegistry";
import { ArgumentError } from "../../../src";
import { createOrderedOperator } from "../../../src/plugin/registration/createOrderedOperator";
import { createCachedOperator } from "../../../src/plugin/registration/createCachedOperator";
import { createOrderedTerminalOperator } from "../../../src/plugin/registration/createOrderedTerminalOperator";
import { createCachedTerminalOperator } from "../../../src/plugin/registration/createCachedTerminalOperator";
import { TyneqCachedEnumerable } from "../../../src/core/TyneqCachedEnumerable";
import { TyneqOrderedEnumerable } from "../../../src/core/ordering/TyneqOrderedEnumerable";

// --- createOrderedOperator ---

describe("createOrderedOperator", () => {
    afterEach(() => {
        OperatorRegistry.unregister("testOrderedFactory");
        OperatorRegistry.unregister("testOrderedFactoryValidated");
    });

    it("registers the operator in the registry", () => {
        createOrderedOperator({
            name: "testOrderedFactory",
            category: "buffer",
            factory: (source, node) => source,
        });
        expect(OperatorRegistry.get("testOrderedFactory")).toBeDefined();
    });

    it("registered metadata targetClass is TyneqOrderedEnumerable", () => {
        createOrderedOperator({
            name: "testOrderedFactory",
            category: "buffer",
            factory: (source) => source,
        });
        expect(OperatorRegistry.get("testOrderedFactory")?.metadata.targetClass).toBe(TyneqOrderedEnumerable);
    });

    it("registered metadata has the correct category", () => {
        createOrderedOperator({
            name: "testOrderedFactory",
            category: "streaming",
            factory: (source) => source,
        });
        expect(OperatorRegistry.get("testOrderedFactory")?.metadata.kind).toBe("streaming");
    });

    it("factory is called with source and node", () => {
        let receivedSource: unknown = null;
        createOrderedOperator({
            name: "testOrderedFactory",
            category: "buffer",
            factory: (source, _node) => {
                receivedSource = source;
                return source;
            },
        });
        const ordered = Tyneq.from([3, 1, 2]).orderBy((x) => x);
        (ordered as any).testOrderedFactory();
        expect(receivedSource).toBe(ordered);
    });

    it("validate fires eagerly before factory", () => {
        let factoryCalled = false;
        createOrderedOperator<number, [number]>({
            name: "testOrderedFactoryValidated",
            category: "buffer",
            factory: (source) => {
                factoryCalled = true;
                return source;
            },
            validate: (n) => {
                if (n < 0) throw new ArgumentError("n must be non-negative", "n");
            },
        });
        const ordered = Tyneq.from([1, 2, 3]).orderBy((x) => x);
        expect(() => (ordered as any).testOrderedFactoryValidated(-1)).toThrow(ArgumentError);
        expect(factoryCalled).toBe(false);
    });
});

// --- createCachedOperator ---

describe("createCachedOperator", () => {
    afterEach(() => {
        OperatorRegistry.unregister("testCachedFactory");
        OperatorRegistry.unregister("testCachedFactoryValidated");
    });

    it("registers the operator in the registry", () => {
        createCachedOperator({
            name: "testCachedFactory",
            category: "streaming",
            factory: (source) => source,
        });
        expect(OperatorRegistry.get("testCachedFactory")).toBeDefined();
    });

    it("registered metadata targetClass is TyneqCachedEnumerable", () => {
        createCachedOperator({
            name: "testCachedFactory",
            category: "streaming",
            factory: (source) => source,
        });
        expect(OperatorRegistry.get("testCachedFactory")?.metadata.targetClass).toBe(TyneqCachedEnumerable);
    });

    it("factory is called with source", () => {
        let receivedSource: unknown = null;
        createCachedOperator({
            name: "testCachedFactory",
            category: "streaming",
            factory: (source) => {
                receivedSource = source;
                return source;
            },
        });
        const cached = Tyneq.from([1, 2, 3]).memoize();
        (cached as any).testCachedFactory();
        expect(receivedSource).toBe(cached);
    });

    it("validate fires eagerly before factory", () => {
        let factoryCalled = false;
        createCachedOperator<number, [number]>({
            name: "testCachedFactoryValidated",
            category: "buffer",
            factory: (source) => {
                factoryCalled = true;
                return source;
            },
            validate: (n) => {
                if (n < 0) throw new ArgumentError("n must be non-negative", "n");
            },
        });
        const cached = Tyneq.from([1]).memoize();
        expect(() => (cached as any).testCachedFactoryValidated(-1)).toThrow(ArgumentError);
        expect(factoryCalled).toBe(false);
    });
});

// --- createOrderedTerminalOperator ---

describe("createOrderedTerminalOperator", () => {
    afterEach(() => {
        OperatorRegistry.unregister("testOrderedTerminalFactory");
        OperatorRegistry.unregister("testOrderedTerminalFactoryValidated");
    });

    it("registers the terminal in the registry", () => {
        createOrderedTerminalOperator({
            name: "testOrderedTerminalFactory",
            execute: (source) => [...source].length,
        });
        expect(OperatorRegistry.get("testOrderedTerminalFactory")).toBeDefined();
    });

    it("registered metadata kind is terminal", () => {
        createOrderedTerminalOperator({
            name: "testOrderedTerminalFactory",
            execute: (source) => [...source].length,
        });
        expect(OperatorRegistry.get("testOrderedTerminalFactory")?.metadata.kind).toBe("terminal");
    });

    it("registered metadata targetClass is TyneqOrderedEnumerable", () => {
        createOrderedTerminalOperator({
            name: "testOrderedTerminalFactory",
            execute: (source) => [...source].length,
        });
        expect(OperatorRegistry.get("testOrderedTerminalFactory")?.metadata.targetClass).toBe(TyneqOrderedEnumerable);
    });

    it("execute is called with source and returns result", () => {
        createOrderedTerminalOperator({
            name: "testOrderedTerminalFactory",
            execute: (source) => [...source].length,
        });
        const ordered = Tyneq.from([3, 1, 2]).orderBy((x) => x);
        expect((ordered as any).testOrderedTerminalFactory()).toBe(3);
    });

    it("validate fires eagerly", () => {
        createOrderedTerminalOperator<number, [number], number>({
            name: "testOrderedTerminalFactoryValidated",
            execute: (source, n) => n,
            validate: (n) => {
                if (n < 0) throw new ArgumentError("n must be non-negative", "n");
            },
        });
        const ordered = Tyneq.from([1]).orderBy((x) => x);
        expect(() => (ordered as any).testOrderedTerminalFactoryValidated(-1)).toThrow(ArgumentError);
    });

    it("source defaults to external", () => {
        createOrderedTerminalOperator({
            name: "testOrderedTerminalFactory",
            execute: () => true,
        });
        expect(OperatorRegistry.get("testOrderedTerminalFactory")?.metadata.source).toBe("external");
    });
});

// --- createCachedTerminalOperator ---

describe("createCachedTerminalOperator", () => {
    afterEach(() => {
        OperatorRegistry.unregister("testCachedTerminalFactory");
        OperatorRegistry.unregister("testCachedTerminalFactoryValidated");
    });

    it("registers the terminal in the registry", () => {
        createCachedTerminalOperator({
            name: "testCachedTerminalFactory",
            execute: (source) => [...source].length,
        });
        expect(OperatorRegistry.get("testCachedTerminalFactory")).toBeDefined();
    });

    it("registered metadata kind is terminal", () => {
        createCachedTerminalOperator({
            name: "testCachedTerminalFactory",
            execute: () => 0,
        });
        expect(OperatorRegistry.get("testCachedTerminalFactory")?.metadata.kind).toBe("terminal");
    });

    it("registered metadata targetClass is TyneqCachedEnumerable", () => {
        createCachedTerminalOperator({
            name: "testCachedTerminalFactory",
            execute: () => 0,
        });
        expect(OperatorRegistry.get("testCachedTerminalFactory")?.metadata.targetClass).toBe(TyneqCachedEnumerable);
    });

    it("execute is called with source and returns result", () => {
        createCachedTerminalOperator({
            name: "testCachedTerminalFactory",
            execute: (source) => [...source].length,
        });
        const cached = Tyneq.from([1, 2, 3, 4]).memoize();
        expect((cached as any).testCachedTerminalFactory()).toBe(4);
    });

    it("validate fires eagerly", () => {
        createCachedTerminalOperator<number, [number], number>({
            name: "testCachedTerminalFactoryValidated",
            execute: (_source, n) => n,
            validate: (n) => {
                if (n < 0) throw new ArgumentError("n must be non-negative", "n");
            },
        });
        const cached = Tyneq.from([1]).memoize();
        expect(() => (cached as any).testCachedTerminalFactoryValidated(-5)).toThrow(ArgumentError);
    });

    it("source defaults to external", () => {
        createCachedTerminalOperator({
            name: "testCachedTerminalFactory",
            execute: () => true,
        });
        expect(OperatorRegistry.get("testCachedTerminalFactory")?.metadata.source).toBe("external");
    });
});
