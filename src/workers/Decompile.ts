import type { BehaviorSubject } from "rxjs";
import type { DecompileResult } from "../logic/Decompiler";
import type { Options } from "../logic/vf";
import { openArrayBufferJar } from "../utils/Jar";

type DecompileWorker = typeof import("./DecompileWorker");

export async function decompileJar(buffer: ArrayBuffer, options: Options, progress: BehaviorSubject<number>): Promise<Record<string, DecompileResult>> {
    const threads = navigator.hardwareConcurrency || 4;
    const workers = Array.from({ length: threads }, () => createWrorker());

    console.log(`Decompiling using ${threads} threads`);

    const jar = await openArrayBufferJar(buffer);
    const classNames = Object.keys(jar.entries)
        .filter(name => name.endsWith(".class"))
        .filter(name => !name.includes("$")); // Skip inner classes, as they will be decompiled along with their outer class

    let results: Record<string, DecompileResult> = {};
    let promises: Promise<void>[] = [];

    let taskQueue = [...classNames];
    let completed = 0;

    for (let i = 0; i < workers.length; i++) {
        const worker = workers[i];
        worker.prepare(buffer);

        promises.push(new Promise(async (resolve) => {
            while (true) {
                // Get the next task
                const nextTask = taskQueue.pop();

                if (!nextTask) {
                    // No more work left to do
                    resolve();
                    return;
                }

                const result = await worker.decompile(nextTask, options);
                results[nextTask] = result;
                // percentage progress
                progress.next(Math.round((++completed / classNames.length) * 100));
            }

            throw new Error("Unreachable");
        }));
    }

    await Promise.all(promises);
    workers.forEach(worker => worker.close());

    return results;
}

function createWrorker() {
    return new ComlinkWorker<DecompileWorker>(
        new URL("./DecompileWorker", import.meta.url),
        {
        }
    );
}