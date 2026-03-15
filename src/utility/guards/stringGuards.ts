import { ArgumentError } from "../../core/errors/argument/ArgumentError";
import type { Optional } from "../../types/utility";
import { NullGuards } from "./nullGuards";

/**
 * Static assertion class for string checks.
 *
 * @group Utilities
 * @internal
 */
export class StringGuards {
    private constructor() { }

    /**
     * Asserts that `value` is a non-null, non-undefined, non-whitespace string.
     * @throws {ArgumentNullError} When `null`.
     * @throws {ArgumentError} When `undefined`, empty, or whitespace-only.
     */
    static checkNotNullOrWhiteSpace(value: Optional<string>, paramName: string): asserts value is string {
        NullGuards.checkNotOptional(value, paramName);
        if (value.trim().length === 0) {
            throw new ArgumentError(`'${paramName}' cannot be empty or whitespace.`, paramName);
        }
    }
}
