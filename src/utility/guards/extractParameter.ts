import type { KeyValuePair } from "../../types/core";
import { nameof } from "../nameof";

/**
 * Normalises the two-overload pattern used by `ArgumentUtility`:
 * either a `{ paramName: value }` object (name inferred) or a raw value + explicit name.
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
