import JSZip from 'jszip';
import { BehaviorSubject, map } from 'rxjs';
import { decompileClass } from './Decompiler';

export interface IndexProgress {
    current: number;
    total: number;
    name: string;
}

const DEFAULT_PROGRESS: IndexProgress = { current: 0, total: -1, name: "" };

export const indexProgress = new BehaviorSubject<IndexProgress>(DEFAULT_PROGRESS);
export const isIndexing = indexProgress.pipe(
    map(progress => progress.total >= 0)
);

let isRunning = false;

export async function refreshIndex(jar: JSZip): Promise<void> {
    if (isRunning) {
        throw new Error("Indexing is already in progress");
    }

    isRunning = true;

    try {
        const classesToIndex = Object.keys(jar.files).filter(file => file.endsWith('.class') && !file.includes('$'));
        indexProgress.next({ current: 0, total: classesToIndex.length, name: "" });

        for (const [index, className] of classesToIndex.entries()) {
            indexProgress.next({ ...indexProgress.value, current: index + 1, name: className });

            const source = await decompileClass(className, jar, {});
            console.log(`Decompiled ${className}`);
        }
    } finally {
        isRunning = false;
        indexProgress.next(DEFAULT_PROGRESS);
    }
}
