import { ArgumentError } from "../../core/errors/argument/ArgumentError";
import type { Optional } from "../../types/utility";
import { NullGuards } from "./nullGuards";

/**
 * String-specific guard implementations. Called by `ArgumentUtility`.
 *
 * @internal
 */
export class StringGuards {
    private constructor() { }

    
    public static checkNotNullOrWhiteSpace(value: Optional<string>, paramName: string): asserts value is string {
        NullGuards.checkNotOptional(value, paramName);
        if (value.trim().length === 0) {
            throw new ArgumentError(`'${paramName}' cannot be empty or whitespace.`, paramName);
        }
    }
}
