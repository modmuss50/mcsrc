import wasmPath from "../../node_modules/@run-slicer/vf/vf.wasm?url";
import loadPath from "../../node_modules/@run-slicer/vf/vf.wasm-runtime.js?url";

export type Options = Record<string, string>;

export interface Config {
    source?: (name: string) => Promise<Uint8Array | null>;
    resources?: string[];
    options?: Options;
}


// Copied from ../node_modules/@run-slicer/vf/vf.js as I needed to get the correct import paths
let decompileFunc: any = null;
export const decompile = async (name: string, options: Config) => {
    if (!decompileFunc) {
        const { load } = await import(loadPath);
        const { exports } = await load(wasmPath, { noAutoImports: true });

        decompileFunc = exports.decompile;
    }

    return decompileFunc(name, options);
};
