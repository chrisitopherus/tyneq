/**
 * Entry point for the Tyneq utility API.
 *
 * Import from `"tyneq/utility"` to access argument validation, type guards,
 * reflection helpers, lazy initialisation, and the validation builder.
 *
 * @example
 * ```ts
 * import { ArgumentUtility, TypeGuardUtility } from "tyneq/utility";
 *
 * function take(count: number) {
 *     ArgumentUtility.checkPositive({ count });
 * }
 *
 * if (TypeGuardUtility.isIterable(value)) { ... }
 * ```
 *
 * @module tyneq/utility
 */

export { ArgumentUtility } from "./ArgumentUtility";
export { TypeGuardUtility } from "./TypeGuardUtility";
export { ValidationBuilder } from "./ValidationBuilder";
export { ReflectionUtility } from "./ReflectionUtility";
export { Lazy } from "./Lazy";
