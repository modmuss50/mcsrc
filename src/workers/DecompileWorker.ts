import { decompileClass, type DecompileResult } from "../logic/Decompiler";
import type { Options } from "../logic/vf";
import { openArrayBufferJar, type Jar } from "../utils/Jar";

var _openJar: Jar | undefined;

export const prepare = async (buffer: ArrayBuffer) => {
    const jar = await openArrayBufferJar(buffer);
    _openJar = jar;
};

export const decompile = async (className: string, options: Options): Promise<DecompileResult> => {
    if (!_openJar) {
        throw new Error("Jar not opened. Call prepare() first.");
    }

    return decompileClass(className, _openJar, options);
};

export const close = () => {
    _openJar = undefined;
};