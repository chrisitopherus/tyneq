import { TyneqError } from "../TyneqError";

export class ArgumentError extends TyneqError {
  public readonly paramName?: string;

  constructor(message: string, paramName?: string, inner?: Error) {
    super(message, { inner });
    this.paramName = paramName;
  }
}