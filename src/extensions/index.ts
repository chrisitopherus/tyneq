/**
 * @module extensions
 *
 * Public API for extending Tyneq with custom operators.
 *
 * ## Registration mechanisms — pick what fits:
 *
 * | Mechanism                   | When to use                                          | Requires |
 * |-----------------------------|------------------------------------------------------|----------|
 * | `@operator(name)`           | Class-based streaming/buffer operator (library grade)| TS 5.0+  |
 * | `@terminal(name)`           | Class-based terminal operator (library grade)         | TS 5.0+  |
 * | `createOperator(config)`    | Functional streaming/buffer, custom factory          | None     |
 * | `createStreamingOperator()` | Functional streaming, generator shorthand            | None     |
 * | `createTerminalOperator()`  | Functional terminal                                  | None     |
 * | `.pipe(factory)`            | One-off inline transform, no registration at all     | None     |
 *
 * ## Type augmentation
 *
 * Runtime registration alone does not teach TypeScript about the new method.
 * External developers must always add a `declare module 'tyneq'` block:
 *
 * ```ts
 * // my-operators/scan.ts
 * import { createStreamingOperator } from 'tyneq/extensions';
 *
 * createStreamingOperator({ name: 'scan', *generator(source, seed, acc) { ... } });
 *
 * declare module 'tyneq' {
 *     interface TyneqSequence<TSource> {
 *         scan<TAcc>(seed: TAcc, acc: (a: TAcc, item: TSource) => TAcc): TyneqSequence<TAcc>;
 *     }
 * }
 * ```
 *
 * For library-provided operators, type signatures are declared directly on
 * `TyneqSequence` in `src/types/core.ts`.
 */
export { operator } from "./operator";
export { terminal } from "./terminal";
export { createOperator } from "./createOperator";
export { createStreamingOperator } from "./createStreamingOperator";
export { createTerminalOperator } from "./createTerminalOperator";
export { OperatorRegistry } from "./OperatorRegistry";
export { OperatorMetadata } from "./OperatorRegistry";
export type { OperatorEntry } from "./OperatorRegistry";
// Base classes for class-based custom operators
export { TyneqEnumerator } from "../core/enumerators/TyneqEnumerator";
export { TyneqBaseEnumerator } from "../core/enumerators/TyneqBaseEnumerator";
export { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
