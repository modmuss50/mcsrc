import { load } from "../../indexer/build/generated/teavm/wasm-gc/indexer.wasm-runtime.js";
import indexerWasm from '../../indexer/build/generated/teavm/wasm-gc/indexer.wasm?url';
import { UsageIndexDB } from './UsageIndexDB';

export const index = async (data: ArrayBufferLike, version: string): Promise<void> => {
    const teavm = await load(indexerWasm);
    const indexer = teavm.exports as Indexer;
    const db = new UsageIndexDB(version);
    await db.open();

    const usageMap = new Map<string, Set<string>>();

    const addUsage = (key: string, value: string) => {
        if (!usageMap.has(key)) {
            usageMap.set(key, new Set());
        }
        usageMap.get(key)!.add(value);
    };

    const context: Context = {
        addClassUsage: function (clazz: Class, usage: UsageString): void {
            addUsage(clazz, usage);
        },
        addMethodUsage: function (method: Method, usage: UsageString): void {
            addUsage(method, usage);
        },
        addFieldUsage: function (field: Field, usage: UsageString): void {
            addUsage(field, usage);
        }
    };

    indexer.index(data, context);
    await db.batchWrite(usageMap);

    db.close();
};

type Class = string;
type Method = `${string}:${string}:${string}`;
type Field = `${string}:${string}:${string}`;

type UsageString =
    | `c:${Class}`
    | `m:${Method}`
    | `f:${Field}`;

interface Context {
    addClassUsage: (clazz: Class, usage: UsageString) => void;
    addMethodUsage: (method: Method, usage: UsageString) => void;
    addFieldUsage: (field: Field, usage: UsageString) => void;
}

interface Indexer {
    index(data: ArrayBufferLike, context: Context): void;
}