import { ArgumentError } from '../../core/errors/argument/ArgumentError';
import type { Optional } from '../../types/utility';
import { checkNotOptional } from './nullGuards';

/**
 * Asserts that `value` is a non-null, non-undefined, non-whitespace string.
 * @throws {ArgumentNullError} When `null`.
 * @throws {ArgumentError} When `undefined`, empty, or whitespace-only.
 * @internal
 */
export function checkNotNullOrWhiteSpace(value: Optional<string>, paramName: string): asserts value is string {
    checkNotOptional(value, paramName);
    if (value.trim().length === 0) {
        throw new ArgumentError(`'${paramName}' cannot be empty or whitespace.`, paramName);
    }
}
