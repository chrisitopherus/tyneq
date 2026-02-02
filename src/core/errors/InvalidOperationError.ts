import { TyneqError } from "./TyneqError";

export class InvalidOperationError extends TyneqError {
  constructor(message = "The operation is invalid in the current state.", inner?: Error) {
    super(message, { inner });
  }
}