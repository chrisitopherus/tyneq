import type { KeyValuePair } from "../../types/core";
import { nameof } from "../nameof";

/**
 * Extracts the parameter name and value from either invocation style.
 *
 * - Shorthand: `extractParameter({ value })` — name inferred from object key.
 * - Explicit: `extractParameter(value, 'paramName')` — name passed directly.
 *
 * @returns A `KeyValuePair` where `key` is the parameter name and `value` is the parameter value.
 *
 * @internal
 */
export function extractParameter<T>(param: Record<string, T>): KeyValuePair<string, T>;
export function extractParameter<T>(param: T, paramName: string): KeyValuePair<string, T>;
export function extractParameter<T>(param: Record<string, T> | T, paramName?: string): KeyValuePair<string, T> {
    const [extractedParamName, value] = paramName
        ? [paramName, param as T]
        : nameof(param as Record<string, T>);
    return { key: extractedParamName, value };
}
