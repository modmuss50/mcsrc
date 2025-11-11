import { BehaviorSubject, combineLatest, distinctUntilChanged, filter, from, map, shareReplay, switchMap, tap, Observable } from "rxjs";
import JSZip from 'jszip';
import { agreedEula } from "./Settings";
import { state, updateSelectedMinecraftVersion } from "./State";

const CACHE_NAME = 'mcsrc-v1';
const FABRIC_EXPERIMENTAL_VERSIONS_URL = "https://maven.fabricmc.net/net/minecraft/experimental_versions.json";

interface VersionsList {
    versions: VersionListEntry[];
}

interface VersionListEntry {
    id: string;
    type: string;
    url: string;
    time: string;
    releaseTime: string;
    sha1: string;
}

interface VersionManifest {
    id: string;
    downloads: {
        [key: string]: {
            url: string;
            sha1: string;
        };
    };
}

export interface JarBlob {
    version: string;
    blob: Blob;
}

export interface Jar {
    version: string;
    zip: JSZip;
}

export const minecraftVersions = new BehaviorSubject<VersionListEntry[]>([]);
export const minecraftVersionIds = minecraftVersions.pipe(
    map(versions => versions.map(v => v.id))
);
export const selectedMinecraftVersion = new BehaviorSubject<string | null>(null);

export const downloadProgress = new BehaviorSubject<number | undefined>(undefined);

export const minecraftJarBlob = minecraftJarBlobPipeline(selectedMinecraftVersion, downloadProgress);
export function minecraftJarBlobPipeline(source$: Observable<string | null>, progress: BehaviorSubject<number | undefined>): Observable<JarBlob> {
    return source$.pipe(
        filter(id => id !== null),
        distinctUntilChanged(),
        tap(versionId => updateSelectedMinecraftVersion()),
        map(versionId => getVersionEntryById(versionId!)!),
        switchMap(versionEntry => from(downloadMinecraftJar(versionEntry, progress))),
        shareReplay({ bufferSize: 1, refCount: false })
    );
}

export const minecraftJar = minecraftJarPipeline(minecraftJarBlob);
export function minecraftJarPipeline(source$: Observable<JarBlob>): Observable<Jar> {
    return source$.pipe(
        tap((blob) => console.log(`Loading Minecraft jar ${blob.version}`)),
        switchMap(blob => from(openJar(blob))),
        shareReplay({ bufferSize: 1, refCount: false })
    );
}

async function getJson<T>(url: string): Promise<T> {
    console.log(`Fetching JSON from ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch JSON from ${url}: ${response.statusText}`);
    }

    return response.json();
}

async function fetchVersions(): Promise<VersionsList> {
    return getJson<VersionsList>(FABRIC_EXPERIMENTAL_VERSIONS_URL);
}

async function fetchVersionManifest(version: VersionListEntry): Promise<VersionManifest> {
    return getJson<VersionManifest>(version.url);
}

function getVersionEntryById(id: string): VersionListEntry | undefined {
    const versions = minecraftVersions.value;
    return versions.find(v => v.id === id);
}

async function cachedFetch(url: string): Promise<Response> {
    if (!('caches' in window)) {
        return fetch(url);
    }

    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
        return cachedResponse
    };

    const response = await fetch(url);
    if (response.ok) {
        cache.put(url, response.clone());
    }
    return response;
}

async function downloadMinecraftJar(version: VersionListEntry, progress: BehaviorSubject<number | undefined>): Promise<JarBlob> {
    console.log(`Downloading Minecraft jar for version: ${version.id}`);
    const versionManifest = await fetchVersionManifest(version);
    const response = await cachedFetch(versionManifest.downloads.client.url);
    if (!response.ok) {
        throw new Error(`Failed to download Minecraft jar: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (!response.body || total === 0) {
        const blob = await response.blob();
        progress.next(undefined);
        return { version: version.id, blob };
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let receivedLength = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        const percent = Math.round((receivedLength / total) * 100);
        progress.next(percent);
    }

    const blob = new Blob(chunks);
    progress.next(undefined)
    return { version: version.id, blob };
}

async function openJar(blob: JarBlob): Promise<Jar> {
    const zip = await JSZip.loadAsync(blob.blob);
    return { version: blob.version, zip };
}

async function initialize(version: string | null = null) {
    const versionsList = await fetchVersions();
    const debofVersions = versionsList.versions.filter(v => v.type === "unobfuscated").reverse();
    minecraftVersions.next(debofVersions);

    // This triggers the download
    selectedMinecraftVersion.next(version || debofVersions[0].id);
}

let hasInitialized = false;

// Automatically download the Minecraft jar only when the user has agreed to the EULA
combineLatest([agreedEula.observable, state]).subscribe(([agreed, currentState]) => {
    if (agreed && !hasInitialized) {
        hasInitialized = true;
        initialize(currentState.minecraftVersion);
    }
});
