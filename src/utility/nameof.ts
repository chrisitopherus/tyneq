import { Tyneq } from "..";
import { TyneqError } from "../core/errors/TyneqError";
import { ArgumentUtility } from "./argumentUtility";

export function nameof(param: Record<string, unknown>): string {
    ArgumentUtility.checkNotNull(param, "param");

    if (typeof param !== "object") {
        throw new TyneqError("nameof() expects an object.");
    }

    return Object.keys(param)[0];
}