import { ArgumentError } from "./ArgumentError";

export class ArgumentNullError extends ArgumentError {
  constructor(paramName: string, inner?: Error) {
    super(`${paramName} cannot be null.`, paramName, inner);
  }
}