import type { BehaviorSubject } from "rxjs";
import type { MinecraftJar } from "../logic/MinecraftApi";
import { UsageIndexDB } from "./UsageIndexDB";

type UsageIndexWorker = typeof import("./UsageIndexWorker");

export async function indexJar(minecraftJar: MinecraftJar, progress: BehaviorSubject<number>): Promise<void> {
    const startTime = performance.now();

    progress.next(0);

    const db = new UsageIndexDB(minecraftJar.version);
    await db.open();
    await db.clear();
    db.close();

    const threads = navigator.hardwareConcurrency || 4;
    const workers = Array.from({ length: threads }, () => createWrorker());

    console.log(`Indexing minecraft jar using ${threads} threads`);

    const jar = minecraftJar.jar;
    const classNames = Object.keys(jar.entries)
        .filter(name => name.endsWith(".class"));

    let promises: Promise<void>[] = [];

    let taskQueue = [...classNames];
    let completed = 0;

    for (let i = 0; i < workers.length; i++) {
        const worker = workers[i];

        promises.push(new Promise(async (resolve) => {
            while (true) {
                const nextTask = taskQueue.pop();

                if (!nextTask) {
                    resolve();
                    return;
                }

                progress.next(Math.round((++completed / classNames.length) * 100));

                const entry = jar.entries[nextTask];
                const data = await entry.bytes();

                await worker.index(data.buffer, minecraftJar.version);
            }
        }));
    }

    await Promise.all(promises);

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`Indexing completed in ${duration} seconds`);

    progress.next(-1);
}

function createWrorker() {
    return new ComlinkWorker<UsageIndexWorker>(
        new URL("./UsageIndexWorker", import.meta.url),
        {
        }
    );
}
