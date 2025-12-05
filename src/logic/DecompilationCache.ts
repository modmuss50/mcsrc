import type { DecompileResult } from "./Decompiler";
import { selectedMinecraftVersion } from "./MinecraftApi";
import { openTabs } from "./Tabs";

const cache = new Map<string, DecompileResult>();

function get(version: string, className: string) {
    return cache.get(`${version}:${className}`);
}

function put(version: string, className: string, contents: DecompileResult) {
    limitCacheSize();
    cache.set(`${version}:${className}`, contents);
}

// Limits cache size to 75 items
// Deletes cache items in the following order:
//  - Closed file of version different than active one
//  - Closed file of same version as the active one
//  - Open file
function limitCacheSize() {
    while (cache.size >= 75) {
        let firstNotOpenAndNotVersion: string | undefined;
        let firstNotOpen: string | undefined;
        let first: string | undefined;

        for (const key of cache.keys()) {
            if (!first) first = key;

            const isOpen = openTabs.getValue().includes(key);
            const keyVersion = key.substring(0, key.indexOf(":"));
            const isCurrentVersion = selectedMinecraftVersion.getValue() === keyVersion;

            if (!isOpen) {
                if (!firstNotOpen) firstNotOpen = key;
                if (!isCurrentVersion && !firstNotOpenAndNotVersion) {
                    firstNotOpenAndNotVersion = key;
                }
            }

            // if we found the best possible case we can stop
            if (firstNotOpenAndNotVersion) break;
        }

        const toDelete =
            firstNotOpenAndNotVersion ??
            firstNotOpen ??
            first;

        if (toDelete) cache.delete(toDelete);
    }
}

export const decompilationCache = {
    put,
    get
};