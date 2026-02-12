import type { CacheData } from "../types/index.ts";
import { logCache } from "../utils/logger.ts";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cache: CacheData | null = null;

export function get(): CacheData | null {
	if (!cache) {
		logCache("MISS", "session_data");
		return null;
	}

	if (!isValid()) {
		cache = null;
		logCache("MISS", "session_data_expired");
		return null;
	}

	logCache("HIT", "session_data");
	return cache;
}

export function set(data: Omit<CacheData, "timestamp">): void {
	cache = {
		...data,
		timestamp: Date.now(),
	};
	logCache("SET", "session_data");
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
