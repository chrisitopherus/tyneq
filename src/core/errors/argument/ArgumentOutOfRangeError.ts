import { ArgumentError } from "./ArgumentError";

export class ArgumentOutOfRangeError extends ArgumentError {
  public readonly actualValue?: unknown;

  constructor(paramName: string, message?: string, actualValue?: unknown, inner?: Error) {
    super(message ?? `${paramName} was out of range.`, paramName, inner);
    this.actualValue = actualValue;
  }
}