interface UsageEntry {
    key: string;
    value: string;
}

export class UsageIndexDB {
    private dbName = 'UsageIndexDB';
    private storeName: string;
    private version: string;
    private dbVersion = 1;
    private db: IDBDatabase | null = null;

    constructor(version: string) {
        this.version = version;
        this.storeName = version;
    }

    async open(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (db.objectStoreNames.contains(this.storeName)) {
                    db.deleteObjectStore(this.storeName);
                }

                const store = db.createObjectStore(this.storeName, {
                    keyPath: ['key', 'value']
                });

                store.createIndex('key', 'key', { unique: false });
            };
        });
    }

    async batchWrite(entries: Map<string, Set<string>>): Promise<void> {
        if (!this.db) {
            throw new Error('Database not opened');
        }

        const transaction = this.db.transaction(this.storeName, 'readwrite', { durability: 'relaxed' });
        const store = transaction.objectStore(this.storeName);

        for (const [key, values] of entries) {
            for (const value of values) {
                store.put({ key, value });
            }
        }

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async read(key: string): Promise<string[]> {
        if (!this.db) {
            throw new Error('Database not opened');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('key');

            const request = index.getAll(key);

            request.onsuccess = () => {
                const entries = request.result as UsageEntry[];
                const values = entries.map(entry => entry.value);
                resolve(values);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async clear(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not opened');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
