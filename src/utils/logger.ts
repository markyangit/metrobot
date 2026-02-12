import type { Context } from "grammy";

/**
 * Formata timestamp para logs
 */
function getTimestamp(): string {
	return new Date().toISOString();
}

/**
 * Extrai informações do usuário do contexto
 */
function getUserInfo(ctx: Context) {
	const user = ctx.from;
	if (!user) return null;

	return {
		id: user.id,
		username: user.username || "N/A",
		firstName: user.first_name,
		lastName: user.last_name || "N/A",
		isBot: user.is_bot,
		languageCode: user.language_code || "N/A",
	};
}

/**
 * Extrai informações da mensagem
 */
function getMessageInfo(ctx: Context) {
	const message = ctx.message || ctx.callbackQuery?.message;
	if (!message) return null;

	return {
		messageId: message.message_id,
		chatId: message.chat.id,
		chatType: message.chat.type,
		date: new Date(message.date * 1000).toISOString(),
	};
}

/**
 * Extrai informações do callback query
 */
function getCallbackInfo(ctx: Context) {
	const callback = ctx.callbackQuery;
	if (!callback) return null;

	return {
		id: callback.id,
		data: callback.data,
	};
}

/**
 * Log de comando recebido
 */
export function logCommand(ctx: Context, command: string) {
	const user = getUserInfo(ctx);
	const message = getMessageInfo(ctx);

	console.log(
		JSON.stringify({
			timestamp: getTimestamp(),
			type: "COMMAND",
			command,
			user,
			message,
		}),
	);
}

/**
 * Log de callback query recebido
 */
export function logCallback(ctx: Context, action: string) {
	const user = getUserInfo(ctx);
	const callback = getCallbackInfo(ctx);
	const message = getMessageInfo(ctx);

	console.log(
		JSON.stringify({
			timestamp: getTimestamp(),
			type: "CALLBACK",
			action,
			user,
			callback,
			message,
		}),
	);
}

/**
 * Log de consulta de estações
 */
export function logStationsFetch(
	userId: number,
	stationsCount: number,
	duration: number,
) {
	console.log(
		JSON.stringify({
			timestamp: getTimestamp(),
			type: "STATIONS_FETCH",
			userId,
			stationsCount,
			durationMs: duration,
		}),
	);
}

/**
 * Log de consulta de horários
 */
export function logScheduleFetch(
	userId: number,
	originId: string,
	destinationId: string,
	success: boolean,
	duration: number,
) {
	console.log(
		JSON.stringify({
			timestamp: getTimestamp(),
			type: "SCHEDULE_FETCH",
			userId,
			origin: originId,
			destination: destinationId,
			success,
			durationMs: duration,
		}),
	);
}

/**
 * Log de erro
 */
export function logError(ctx: Context | null, error: unknown, context: string) {
	console.log({ ctx })
	const user = ctx ? getUserInfo(ctx) : null;
	const message = ctx ? getMessageInfo(ctx) : null;

	console.error(
		JSON.stringify({
			timestamp: getTimestamp(),
			type: "ERROR",
			context,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			user,
			message,
		}),
	);
}

/**
 * Log de métrica genérica
 */
export function logMetric(
	name: string,
	value: number,
	labels?: Record<string, string | number>,
) {
	console.log(
		JSON.stringify({
			timestamp: getTimestamp(),
			type: "METRIC",
			name,
			value,
			labels,
		}),
	);
}

/**
 * Log de cache hit/miss
 */
export function logCache(operation: "HIT" | "MISS" | "SET", key: string) {
	console.log(
		JSON.stringify({
			timestamp: getTimestamp(),
			type: "CACHE",
			operation,
			key,
		}),
	);
}

/**
 * Log de inicialização do bot
 */
export function logBotStart() {
	console.log(
		JSON.stringify({
			timestamp: getTimestamp(),
			type: "BOT_START",
			bunVersion: Bun.version,
			nodeEnv: process.env.NODE_ENV || "development",
		}),
	);
}

/**
 * Log de shutdown do bot
 */
export function logBotStop() {
	console.log(
		JSON.stringify({
			timestamp: getTimestamp(),
			type: "BOT_STOP",
		}),
	);
}
