import type { CacheData } from "../types/index.ts";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cache: CacheData | null = null;

export function get(): CacheData | null {
	if (!cache) {
		return null;
	}

	if (!isValid()) {
		cache = null;
		return null;
	}

	return cache;
}

export function set(data: Omit<CacheData, "timestamp">): void {
	cache = {
		...data,
		timestamp: Date.now(),
	};
}

export function isValid(): boolean {
	if (!cache) {
		return false;
	}

	const now = Date.now();
	const elapsed = now - cache.timestamp;

	return elapsed < CACHE_TTL_MS;
}

export function clear(): void {
	cache = null;
}
