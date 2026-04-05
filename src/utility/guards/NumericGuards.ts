import { ArgumentError } from "../../core/errors/argument/ArgumentError";
import { ArgumentOutOfRangeError } from "../../core/errors/argument/ArgumentOutOfRangeError";

/**
 * Numeric range and type guard implementations. Called by `ArgumentUtility`.
 *
 * @internal
 */
export class NumericGuards {
    private constructor() { }

    
    public static checkNonNegative(value: number, paramName: string): void {
        if (!Number.isFinite(value) || value < 0) {
            throw new ArgumentOutOfRangeError(paramName, `'${paramName}' must be a non-negative number.`);
        }
    }

    
    public static checkPositive(value: number, paramName: string): void {
        if (!Number.isFinite(value) || value <= 0) {
            throw new ArgumentOutOfRangeError(paramName, `'${paramName}' must be a positive number.`);
        }
    }

    
    public static checkNegative(value: number, paramName: string): void {
        if (!Number.isFinite(value) || value >= 0) {
            throw new ArgumentOutOfRangeError(paramName, `'${paramName}' must be a negative number.`, value);
        }
    }

    
    public static checkNonPositive(value: number, paramName: string): void {
        if (!Number.isFinite(value) || value > 0) {
            throw new ArgumentOutOfRangeError(paramName, `'${paramName}' must be a non-positive number.`, value);
        }
    }

    
    public static checkInRange(value: number, min: number, max: number, paramName: string): void {
        if (min > max) {
            throw new ArgumentError(`'min' (${min}) must be <= 'max' (${max}).`, "min");
        }
        if (!Number.isFinite(value) || value < min || value > max) {
            throw new ArgumentOutOfRangeError(paramName, `'${paramName}' must be in range [${min}, ${max}].`);
        }
    }

    
    public static checkInteger(value: number, paramName: string): void {
        if (!Number.isFinite(value) || !Number.isInteger(value)) {
            throw new ArgumentError(`'${paramName}' must be an integer.`, paramName);
        }
    }

    
    public static checkFinite(value: number, paramName: string): void {
        if (!Number.isFinite(value)) {
            throw new ArgumentError(`'${paramName}' must be a finite number.`, paramName);
        }
    }

    
    public static checkNotNaN(value: number, paramName: string): void {
        if (Number.isNaN(value)) {
            throw new ArgumentError(`'${paramName}' cannot be NaN.`, paramName);
        }
    }

    
    public static checkSafeInteger(value: number, paramName: string): void {
        if (!Number.isSafeInteger(value)) {
            throw new ArgumentError(`'${paramName}' must be a safe integer.`, paramName);
        }
    }

    
    public static checkArrayIndex(value: number, paramName: string, arrayLength?: number): void {
        NumericGuards.checkSafeInteger(value, paramName);
        const maxLength = arrayLength ?? Number.MAX_SAFE_INTEGER;
        if (value < 0 || value >= maxLength) {
            throw new ArgumentOutOfRangeError(
                paramName,
                `'${paramName}' must be in range [0, ${maxLength}).`,
                value
            );
        }
    }
}
