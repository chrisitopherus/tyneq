/**
 * Entry point for the Tyneq plugin API.
 *
 * Import from `"tyneq/plugin"` to register custom operators, terminal operators,
 * and sequence-specific operators using decorators or factory functions.
 *
 * @example Decorator-based streaming operator:
 * ```ts
 * import { operator, TyneqEnumerator } from "tyneq/plugin";
 * import type { Enumerator } from "tyneq";
 *
 * @operator("myFilter", "streaming", (predicate) => {
 *     if (typeof predicate !== "function") throw new Error("predicate must be a function");
 * })
 * class MyFilterEnumerator<T> extends TyneqEnumerator<T> {
 *     constructor(source: Enumerator<T>, private readonly predicate: (item: T) => boolean) {
 *         super(source);
 *     }
 *     protected handleNext(): IteratorResult<T> {
 *         while (true) {
 *             const next = this.sourceEnumerator.next();
 *             if (next.done || this.predicate(next.value)) return next;
 *         }
 *     }
 * }
 * ```
 *
 * @example Factory-based terminal operator:
 * ```ts
 * import { createTerminalOperator } from "tyneq/plugin";
 *
 * createTerminalOperator({
 *     name: "product",
 *     execute: (source) => {
 *         let result = 1;
 *         for (const item of source) result *= item as number;
 *         return result;
 *     }
 * });
 * ```
 *
 * @module tyneq/plugin
 */

// --- Enumerator base classes ---
export { TyneqBaseEnumerator } from "../core/enumerators/TyneqBaseEnumerator";
export { TyneqEnumerator } from "../core/enumerators/TyneqEnumerator";
export { TyneqCachedEnumerator } from "../core/enumerators/TyneqCachedEnumerator";
export { TyneqOrderedEnumerator } from "../core/enumerators/TyneqOrderedEnumerator";

// --- Terminal operator base classes ---
export { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
export { TyneqCachedTerminalOperator } from "../core/terminal/TyneqCachedTerminalOperator";
export { TyneqOrderedTerminalOperator } from "../core/terminal/TyneqOrderedTerminalOperator";

// --- Class decorators ---
export { operator } from "./decorators/operator";
export { terminal } from "./decorators/terminal";
export { cachedOperator } from "./decorators/cachedOperator";
export { orderedOperator } from "./decorators/orderedOperator";
export { cachedTerminal } from "./decorators/cachedTerminal";
export { orderedTerminal } from "./decorators/orderedTerminal";

// --- Factory functions ---
export { createOperator } from "./registration/createOperator";
export { createGeneratorOperator } from "./registration/createGeneratorOperator";
export { createTerminalOperator } from "./registration/createTerminalOperator";
export { createOrderedOperator } from "./registration/createOrderedOperator";
export { createCachedOperator } from "./registration/createCachedOperator";
export { createOrderedTerminalOperator } from "./registration/createOrderedTerminalOperator";
export { createCachedTerminalOperator } from "./registration/createCachedTerminalOperator";
