import { from, ReplaySubject, switchMap } from "rxjs";
import JSZip from 'jszip';

const MINECRAFT_JAR_URL = "https://piston-data.mojang.com/v1/objects/26551033b7b935436f3407b85d14cac835e65640/client.jar";

export const minecraftJarBlob = new ReplaySubject<Blob>(1);
export const minecraftJar = minecraftJarBlob.pipe(
    switchMap(blob => from(JSZip.loadAsync(blob)))
);

export async function downloadMinecraftJar(): Promise<Blob> {
    const response = await fetch(MINECRAFT_JAR_URL);
    if (!response.ok) {
        throw new Error(`Failed to download Minecraft jar: ${response.statusText}`);
    }
    const blob = await response.blob();
    minecraftJarBlob.next(blob);
    return blob;
}