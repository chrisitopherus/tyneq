export function nameof<T>(param: Record<string, T>): [name: string, value: T] {
    const keys = Object.keys(param);
    const key = keys[0];
    return [key, param[key]] as [string, T];
}