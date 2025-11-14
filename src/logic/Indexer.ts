import { BehaviorSubject, map } from 'rxjs';
import { decompileClass } from './Decompiler';
import type { MinecraftJar } from './MinecraftApi';
import { decompileJar } from '../workers/Decompile';

// Percent complete is total >= 0
export const indexProgress = new BehaviorSubject<number>(-1);
export const isIndexing = indexProgress.pipe(
    map(progress => progress >= 0)
);

let isRunning = false;

export async function refreshIndex(minecraftJar: MinecraftJar): Promise<void> {
    if (isRunning) {
        throw new Error("Indexing is already in progress");
    }

    isRunning = true;

    try {
        const blob = minecraftJar.blob;

        if (!blob) {
            throw new Error("Minecraft jar blob is not available for indexing");
        }

        const arrayBuffer = await blob.arrayBuffer();
        const results = await decompileJar(arrayBuffer, {}, indexProgress);

        console.log(`Decompiled ${Object.keys(results).length} classes for indexing`);
    } finally {
        isRunning = false;
        indexProgress.next(-1);
    }
}