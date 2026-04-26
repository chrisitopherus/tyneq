import { describe, expect, it } from "vitest";
import { DefaultingMap } from "../../../src/utility/DefaultingMap";

describe("DefaultingMap", () => {
    describe("getOrInit", () => {
        it("returns the existing value when key is present", () => {
            const map = new DefaultingMap<string, number>();
            map.set("a", 42);
            expect(map.getOrInit("a", () => 0)).toBe(42);
        });

        it("initialises and stores the value when key is absent", () => {
            const map = new DefaultingMap<string, number>();
            const result = map.getOrInit("a", () => 99);
            expect(result).toBe(99);
            expect(map.get("a")).toBe(99);
        });

        it("does not call initValue when key already exists", () => {
            const map = new DefaultingMap<string, number>();
            map.set("x", 1);
            let called = false;
            map.getOrInit("x", () => { called = true; return 2; });
            expect(called).toBe(false);
        });

        it("returns a falsy stored value (0) without re-initialising", () => {
            const map = new DefaultingMap<string, number>();
            map.set("k", 0);
            let calls = 0;
            const result = map.getOrInit("k", () => { calls++; return 99; });
            expect(result).toBe(0);
            expect(calls).toBe(0);
        });
    });

    describe("setOrUpdate", () => {
        it("sets initValue when key is absent", () => {
            const map = new DefaultingMap<string, number>();
            map.setOrUpdate("a", (v) => v + 1, 10);
            expect(map.get("a")).toBe(10);
        });

        it("replaces with updateValue result when key is present", () => {
            const map = new DefaultingMap<string, number>();
            map.set("a", 5);
            map.setOrUpdate("a", (v) => v * 2, 0);
            expect(map.get("a")).toBe(10);
        });

        it("passes the current value to updateValue", () => {
            const map = new DefaultingMap<string, string>();
            map.set("k", "hello");
            map.setOrUpdate("k", (v) => v + "!", "ignored");
            expect(map.get("k")).toBe("hello!");
        });

        it("calls updateValue (not initValue) for a falsy stored value (0)", () => {
            const map = new DefaultingMap<string, number>();
            map.set("k", 0);
            map.setOrUpdate("k", (v) => v + 10, 999);
            expect(map.get("k")).toBe(10);
        });
    });
});
