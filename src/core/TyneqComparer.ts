export class TyneqComparer {
    public static defaultComparer<T>(a: T, b: T): number {
        return a > b ? 1 : a < b ? -1 : 0;
    }

    public static defaultEqualityComparer<T>(a: T, b: T): boolean {
        return a === b;
    }
}