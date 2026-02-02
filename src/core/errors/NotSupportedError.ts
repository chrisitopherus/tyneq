import { TyneqError } from "./TyneqError";

export class NotSupportedError extends TyneqError {
  constructor(message = "The requested operation is not supported.", inner?: Error) {
    super(message, { inner });
  }
}