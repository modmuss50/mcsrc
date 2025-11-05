import { combineLatest, distinctUntilChanged, from, switchMap, throttleTime } from "rxjs";
import { minecraftJar } from "./MinecraftApi";
import type JSZip from "jszip";
import { decompile } from "./vf";
import { selectedFile } from "./State";

export const currentSource = combineLatest([
    selectedFile,
    minecraftJar
]).pipe(
    distinctUntilChanged(),
    throttleTime(250),
    switchMap(([className, jar]) => from(decompileClass(className, jar)))
);

async function decompileClass(className: string, jar: JSZip): Promise<string> {
    console.log(`Decompiling class: '${className}'`);

    let source = await decompile(className.replace(".class", ""), {
        source: async (name: string) => {
            const file = jar.file(name + ".class");
            if (file) {
                const arrayBuffer = await file.async("arraybuffer");
                return new Uint8Array(arrayBuffer);
            }

            console.error(`File not found in Minecraft jar: ${name}`);
            return null;
        },
        resources: Object.keys(jar.files).filter(f => f.endsWith('.class')).map(f => f.replace(".class", "")),
    });

    return source;
}