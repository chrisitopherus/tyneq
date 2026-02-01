import { InvalidOperationError } from "./InvalidOperationError";

export class SequenceContainsNoElementsError extends InvalidOperationError {
  constructor(inner?: Error) {
    super("Sequence contains no elements.", inner);
  }
}