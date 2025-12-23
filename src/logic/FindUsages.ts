import { BehaviorSubject, combineLatest, distinctUntilChanged, from, map, Observable, switchMap, throttleTime } from "rxjs";
import { usageIndex, type UsageKey, type UsageString } from "../workers/UsageIndex";
import { openTab } from "./Tabs";

export const usageQuery = new BehaviorSubject("");

export const useageResults = usageQuery
    .pipe(
        throttleTime(200),
        distinctUntilChanged(),
        switchMap((query) => {
            if (!query) {
                return from([[]]);
            }
            return usageIndex.pipe(
                switchMap((index) => from(index.getUsage(query)))
            );
        })
    );

export const isViewingUsages = usageQuery.pipe(
    map((query) => query.length > 0)
);

// Format the usage string to be displayed by the user
export function formatUsage(usage: UsageString): string {
    if (usage.startsWith("m:")) {
        const parts = usage.slice(2).split(":");
        return `${parts[1]}${parts[2]}`;
    }
    if (usage.startsWith("f:")) {
        const parts = usage.slice(2).split(":");
        return parts[1];
    }
    if (usage.startsWith("c:")) {
        return usage.slice(2);
    }
    return usage;
}

export function formatUsageQuery(query: UsageKey): string {
    if (query.includes(":")) {
        const parts = query.split(":");
        const className = parts[0].split("/").pop() || parts[0];
        if (parts[2].includes("(")) {
            // It's a method - show descriptor
            return `${className}.${parts[1]}${parts[2]}`;
        } else {
            // It's a field - hide descriptor
            return `${className}.${parts[1]}`;
        }
    }
    // It's a class - strip package name
    return query.split("/").pop() || query;
}

export function goToUsage(usage: UsageString | string) {
    // Handle raw class names as well
    if (!(usage.startsWith("c:") || usage.startsWith("m:") || usage.startsWith("f:"))) {
        usage = `c:${usage}`;
    }

    // TODO support jumping to methods/fields, by finding the appropriate token from the decompiler
    const className = usage.slice(2).split("$")[0];
    openTab(className + ".class");
}