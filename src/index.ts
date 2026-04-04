export * from "./types/core";
export * from "./types/utility";
export * from "./core/tyneq";
export * from "./utility/ArgumentUtility";
export { ReflectionUtility } from "./utility/ReflectionUtility";
export { TypeGuardUtility } from "./utility/TypeGuardUtility";
export { Lazy } from "./utility/Lazy";
export * from "./core/errors/TyneqError";
export * from "./core/errors/InvalidOperationError";
export * from "./core/errors/KeyNotFoundError";
export * from "./core/errors/NotSupportedError";
export * from "./core/errors/SequenceContainsNoElementsError";
export * from "./core/errors/argument/ArgumentError";
export * from "./core/errors/argument/ArgumentNullError";
export * from "./core/errors/argument/ArgumentOutOfRangeError";
export * from "./core/errors/argument/ArgumentTypeError";
export * from "./core/errors/argument/ValidationError";
export * from "./core/errors/CompilerError";
export * from "./core/errors/RegistryError";
export * from "./core/errors/PluginError";
export * from "./core/errors/ReflectionError";
export * from "./utility/ValidationBuilder";

export { OperatorRegistry } from "./core/registry/TyneqOperatorRegistry";
export { OperatorMetadata } from "./core/OperatorMetadata";
export type { OperatorEntry } from "./types/core";

// queryplan
export type { OperatorCategory, SourceKind, QueryPlanNode as IQueryNode, QueryPlanVisitor, QueryPlanPrinterOptions } from "./types/queryplan";
export { tyneqQueryNode, isSourceNode } from "./types/queryplan";
export { QueryNode } from "./queryplan/QueryNode";
export { QueryPlanPrinter } from "./queryplan/QueryPlanPrinter";
export { QueryPlanWalker } from "./queryplan/QueryPlanWalker";
export { QueryPlanTransformer } from "./queryplan/QueryPlanTransformer";
export { QueryPlanOptimizer } from "./queryplan/QueryPlanOptimizer";
export { QueryPlanCompiler } from "./queryplan/compiler/QueryPlanCompiler";

// plugin — decorators
export { operator } from "./plugin/decorators/operator";
export { orderedOperator } from "./plugin/decorators/orderedOperator";
export { cachedOperator } from "./plugin/decorators/cachedOperator";
export { terminal } from "./plugin/decorators/terminal";
export { orderedTerminal } from "./plugin/decorators/orderedTerminal";
export { cachedTerminal } from "./plugin/decorators/cachedTerminal";

// plugin — functional registration
export { createOperator } from "./plugin/registration/createOperator";
export { createGeneratorOperator } from "./plugin/registration/createGeneratorOperator";
export { createOrderedOperator } from "./plugin/registration/createOrderedOperator";
export { createCachedOperator } from "./plugin/registration/createCachedOperator";
export { createTerminalOperator } from "./plugin/registration/createTerminalOperator";
export { createOrderedTerminalOperator } from "./plugin/registration/createOrderedTerminalOperator";
export { createCachedTerminalOperator } from "./plugin/registration/createCachedTerminalOperator";

// Base classes for class-based custom operators
export { TyneqEnumerator } from "./core/enumerators/TyneqEnumerator";
export { TyneqBaseEnumerator } from "./core/enumerators/TyneqBaseEnumerator";
export { TyneqOrderedEnumerator } from "./core/enumerators/TyneqOrderedEnumerator";
export { TyneqCachedEnumerator } from "./core/enumerators/TyneqCachedEnumerator";
export { TyneqTerminalOperator } from "./core/terminal/TyneqTerminalOperator";
export { TyneqOrderedTerminalOperator } from "./core/terminal/TyneqOrderedTerminalOperator";
export { TyneqCachedTerminalOperator } from "./core/terminal/TyneqCachedTerminalOperator";

// Sequence subtypes for instanceof checks and subtype-aware casting
export { TyneqOrderedEnumerable } from "./core/ordering/TyneqOrderedEnumerable";
export { TyneqCachedEnumerable } from "./core/TyneqCachedEnumerable";