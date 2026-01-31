export class TyneqError extends Error {
    public inner: Error | undefined;
    public constructor(message: string, options?: { inner?: Error}) {
        super(message);
        this.name = new.target.name;
        this.inner = options?.inner;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}