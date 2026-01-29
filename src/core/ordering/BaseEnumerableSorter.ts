import { Tyneq } from "../..";

export abstract class BaseEnumerableSorter<TSource> {
    public abstract computeKeys(source: TSource[], count: number): void;
    public abstract compareKeys(i: number, j: number): number;

    public sort(source: TSource[], count: number): number[] {
        this.computeKeys([...source], count);
        const indexMap: number[] = Tyneq.range(0, count).toArray();

        indexMap.sort((a, b) => this.compareKeys(a, b));
        return indexMap;
    }
}