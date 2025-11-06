import { combineLatest, distinctUntilChanged, from, map, Observable, switchMap, throttleTime } from "rxjs";
import { minecraftJar } from "./MinecraftApi";
import type JSZip from "jszip";
import { decompile, type Options } from "./vf";
import { selectedFile } from "./State";
import { removeImports } from "./Settings";


const decompilerOptions: Observable<Options> = removeImports.observable.pipe(
    map(removeImports => (
        { "remove-imports": removeImports ? "1" : "0" }
    ))
);

export const currentSource = combineLatest([
    selectedFile,
    minecraftJar,
    decompilerOptions
]).pipe(
    distinctUntilChanged(),
    throttleTime(250),
    switchMap(([className, jar, options]) => from(decompileClass(className, jar, options)))
);

async function decompileClass(className: string, jar: JSZip, options: Options): Promise<string> {
    console.log(`Decompiling class: '${className}'`);

    const files = Object.keys(jar.files);

    if (!files.includes(className)) {
        console.error(`Class not found in Minecraft jar: ${className}`);
        return `// Class not found: ${className}`;
    }

    try {
        const source = await decompile(className.replace(".class", ""), {
            source: async (name: string) => {
                const file = jar.file(name + ".class");
                if (file) {
                    const arrayBuffer = await file.async("arraybuffer");
                    return new Uint8Array(arrayBuffer);
                }

                console.error(`File not found in Minecraft jar: ${name}`);
                return null;
            },
            resources: files.filter(f => f.endsWith('.class')).map(f => f.replace(".class", "")),
            options
        });
        return source;
    } catch (e) {
        console.error(`Error during decompilation of class '${className}':`, e);
        return `// Error during decompilation: ${e}`;
    }
}