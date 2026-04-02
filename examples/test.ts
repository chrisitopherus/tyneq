import { Tyneq, OperatorRegistry } from "../src/index";

Tyneq.from([1, 2, 3]).all(x => x > 0);

for (const metadata of OperatorRegistry.list()) {
    console.log(metadata)
}

console.log(OperatorRegistry.count());