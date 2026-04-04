import { describe, expect, it } from "vitest";
import { TyneqMap } from "../../../src/utility/TyneqMap";

describe("TyneqMap", () => {
    describe("getOrInit", () => {
        it("returns the existing value when key is present", () => {
            const map = new TyneqMap<string, number>();
            map.set("a", 42);
            expect(map.getOrInit("a", () => 0)).toBe(42);
        });

        it("initialises and stores the value when key is absent", () => {
            const map = new TyneqMap<string, number>();
            const result = map.getOrInit("a", () => 99);
            expect(result).toBe(99);
            expect(map.get("a")).toBe(99);
        });

        it("does not call initValue when key already exists", () => {
            const map = new TyneqMap<string, number>();
            map.set("x", 1);
            let called = false;
            map.getOrInit("x", () => { called = true; return 2; });
            expect(called).toBe(false);
        });
    });

    describe("setOrUpdate", () => {
        it("sets initValue when key is absent", () => {
            const map = new TyneqMap<string, number>();
            map.setOrUpdate("a", (v) => v + 1, 10);
            expect(map.get("a")).toBe(10);
        });

        it("replaces with updateValue result when key is present", () => {
            const map = new TyneqMap<string, number>();
            map.set("a", 5);
            map.setOrUpdate("a", (v) => v * 2, 0);
            expect(map.get("a")).toBe(10);
        });

        it("passes the current value to updateValue", () => {
            const map = new TyneqMap<string, string>();
            map.set("k", "hello");
            map.setOrUpdate("k", (v) => v + "!", "ignored");
            expect(map.get("k")).toBe("hello!");
        });
    });
});
