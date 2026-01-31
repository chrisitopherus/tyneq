import { TyneqError } from "./TyneqError";

export class KeyNotFoundError extends TyneqError {
  constructor(message = "The given key was not present in the dictionary.", inner?: Error) {
    super(message, { inner });
  }
}