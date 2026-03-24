/**
 * @module operators/extensions
 *
 * Side-effect module for built-in operator registration.
 *
 * @remarks
 * Built-in metadata registration happens where operator classes are defined,
 * via internal decorators (`@builtinOperator`, `@builtinTerminal`) that run on
 * module import. This module guarantees all built-in operator modules are loaded
 * once so the registry is fully populated for introspection.
 *
 * @internal
 */

// Streaming operators
import "../streaming/append";
import "../streaming/cast";
import "../streaming/chunk";
import "../streaming/concat";
import "../streaming/defaultIfEmpty";
import "../streaming/ofType";
import "../streaming/pairwise";
import "../streaming/populate";
import "../streaming/prepend";
import "../streaming/scan";
import "../streaming/select";
import "../streaming/selectMany";
import "../streaming/skip";
import "../streaming/skipLast";
import "../streaming/skipWhile";
import "../streaming/split";
import "../streaming/take";
import "../streaming/takeWhile";
import "../streaming/tap";
import "../streaming/tapIf";
import "../streaming/throttle";
import "../streaming/where";
import "../streaming/zip";

// Buffer operators
import "../buffer/backsert";
import "../buffer/distinct";
import "../buffer/distinctBy";
import "../buffer/except";
import "../buffer/exceptBy";
import "../buffer/groupBy";
import "../buffer/groupJoin";
import "../buffer/intersect";
import "../buffer/intersectBy";
import "../buffer/join";
import "../buffer/reverse";
import "../buffer/shuffle";
import "../buffer/union";
import "../buffer/unionBy";

// Terminal operators
import "../terminal/aggregate";
import "../terminal/all";
import "../terminal/any";
import "../terminal/average";
import "../terminal/consume";
import "../terminal/contains";
import "../terminal/count";
import "../terminal/countBy";
import "../terminal/elementAt";
import "../terminal/elementAtOrDefault";
import "../terminal/first";
import "../terminal/firstOrDefault";
import "../terminal/indexOf";
import "../terminal/isNullOrEmpty";
import "../terminal/last";
import "../terminal/lastOrDefault";
import "../terminal/max";
import "../terminal/maxBy";
import "../terminal/min";
import "../terminal/minBy";
import "../terminal/minMax";
import "../terminal/sequenceEqual";
import "../terminal/single";
import "../terminal/singleOrDefault";
import "../terminal/startsWith";
import "../terminal/sum";
import "../terminal/toArray";
import "../terminal/toAsync";
import "../terminal/toMap";
import "../terminal/toRecord";
import "../terminal/toSet";

export type { MinMaxResult } from "../terminal/minMax";
