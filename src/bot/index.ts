import { Bot, type Context, InlineKeyboard } from "grammy";
import { getSchedules, getStations } from "../scraper/metrofor.ts";
import type { Station } from "../types/index.ts";
import {
	logCallback,
	logCommand,
	logError,
	logScheduleFetch,
	logStationsFetch,
} from "../utils/logger.ts";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export const bot = new Bot(BOT_TOKEN);

// Session data para manter estado da conversa
interface SessionData {
	originId?: string;
	destinationId?: string;
	stations?: Station[];
}

const sessions = new Map<number, SessionData>();

function getSession(userId: number): SessionData {
	if (!sessions.has(userId)) {
		sessions.set(userId, {});
	}
	const session = sessions.get(userId);
	if (!session) {
		throw new Error("Session not found after creation");
	}
	return session;
}

/**
 * Comando /start
 */
bot.command("start", async (ctx) => {
	logCommand(ctx, "start");

	await ctx.reply(
		"🚇 Bem-vindo ao Metrobot!\n\n" +
			"Eu posso ajudá-lo a consultar horários do Metrofor (Linha Sul).\n\n" +
			"Use /horario para iniciar uma consulta de horários.\n" +
			"Horários sincronizados com https://info.metrofor.ce.gov.br/",
	);
});

/**
 * Comando /horario - Inicia o fluxo de consulta
 */
bot.command("horario", async (ctx) => {
	if (!ctx.from) return;
	logCommand(ctx, "horario");

	const session = getSession(ctx.from.id);

	try {
		// Buscar lista de estações
		await ctx.reply("🔄 Carregando estações...");
		const startTime = Date.now();
		const stations = await getStations();
		const duration = Date.now() - startTime;

		logStationsFetch(ctx.from.id, stations.length, duration);
		session.stations = stations;

		// Resetar seleções anteriores
		session.originId = undefined;
		session.destinationId = undefined;

		// Criar teclado inline com estações (dividido em grupos)
		const keyboard = new InlineKeyboard();

		// Adicionar estações em linhas de 2 botões
		for (let i = 0; i < stations.length; i++) {
			const station = stations[i];
			if (!station) continue;

			keyboard.text(station.name, `origin_${station.id}`);

			// Quebrar linha a cada 2 botões
			if (i % 2 === 1) {
				keyboard.row();
			}
		}

		await ctx.reply("📍 Selecione a estação de ORIGEM:", {
			reply_markup: keyboard,
		});
	} catch (error) {
		logError(ctx, error, "horario_command");
		await ctx.reply(
			"❌ Erro ao carregar estações. Tente novamente mais tarde.",
		);
	}
});

/**
 * Callback para seleção de estação de origem
 */
bot.callbackQuery(/^origin_(.+)$/, async (ctx) => {
	const originId = ctx.match[1];
	if (!originId) return;

	logCallback(ctx, `select_origin:${originId}`);

	const session = getSession(ctx.from.id);
	session.originId = originId;

	const stations = session.stations || [];
	const originStation = stations.find((s) => s.id === originId);

	await ctx.answerCallbackQuery();
	await ctx.editMessageText(
		`✅ Origem selecionada: ${originStation?.name || originId}`,
	);

	// Criar teclado inline com estações para destino (excluindo a origem)
	const keyboard = new InlineKeyboard();
	const availableStations = stations.filter((s) => s.id !== originId);

	for (let i = 0; i < availableStations.length; i++) {
		const station = availableStations[i];
		if (!station) continue;

		keyboard.text(station.name, `dest_${station.id}`);

		// Quebrar linha a cada 2 botões
		if (i % 2 === 1) {
			keyboard.row();
		}
	}

	await ctx.reply("📍 Selecione a estação de DESTINO:", {
		reply_markup: keyboard,
	});
});

/**
 * Callback para seleção de estação de destino
 */
bot.callbackQuery(/^dest_(.+)$/, async (ctx) => {
	const destinationId = ctx.match[1];
	if (!destinationId) return;

	logCallback(ctx, `select_destination:${destinationId}`);

	const session = getSession(ctx.from.id);
	session.destinationId = destinationId;

	const stations = session.stations || [];
	const destStation = stations.find((s) => s.id === destinationId);

	await ctx.answerCallbackQuery();
	await ctx.editMessageText(
		`✅ Destino selecionado: ${destStation?.name || destinationId}`,
	);

	// Perguntar sobre data/hora
	const keyboard = new InlineKeyboard()
		.text("⏰ Agora", "time_now")
		.row()
		.text("📅 Escolher data/hora", "time_custom");

	await ctx.reply("🕐 Quando você deseja viajar?", { reply_markup: keyboard });
});

/**
 * Callback para "Agora"
 */
bot.callbackQuery("time_now", async (ctx) => {
	logCallback(ctx, "time_now");

	const session = getSession(ctx.from.id);

	await ctx.answerCallbackQuery();
	await ctx.editMessageText("🔄 Buscando horários...");

	if (!session.originId || !session.destinationId) {
		await ctx.reply(
			"❌ Erro: estações não selecionadas. Use /horario para começar novamente.",
		);
		return;
	}

	await fetchAndShowSchedule(ctx, session.originId, session.destinationId);
});

/**
 * Callback para "Escolher data/hora"
 */
bot.callbackQuery("time_custom", async (ctx) => {
	logCallback(ctx, "time_custom");

	await ctx.answerCallbackQuery();
	await ctx.editMessageText(
		"📅 Recurso em desenvolvimento.\n\n" +
			"Por enquanto, use a opção 'Agora' para consultar horários atuais.\n\n" +
			"Use /horario para fazer uma nova consulta.",
	);
});

/**
 * Busca e exibe as informações de horário
 */
async function fetchAndShowSchedule(
	ctx: Context,
	originId: string,
	destinationId: string,
	dateTime?: string,
) {
	const startTime = Date.now();

	try {
		const scheduleInfo = await getSchedules(originId, destinationId, dateTime);
		const duration = Date.now() - startTime;

		if (!scheduleInfo) {
			logScheduleFetch(
				ctx.from?.id || 0,
				originId,
				destinationId,
				false,
				duration,
			);
			await ctx.reply(
				"❌ Não foi possível obter informações de horários.\n" +
					"Tente novamente mais tarde ou verifique se as estações selecionadas estão corretas.",
			);
			return;
		}

		logScheduleFetch(
			ctx.from?.id || 0,
			originId,
			destinationId,
			true,
			duration,
		);

		// Formatar mensagem de resposta
		let message = `🚇 Viagem: ${scheduleInfo.origin} → ${scheduleInfo.destination}\n\n`;
		message += `⏰ Saída (origem): ${scheduleInfo.originEstimatedTime}\n`;
		message += `🏁 Chegada (destino): ${scheduleInfo.destinationArrivalTime}\n`;
		message += `⏱️ Tempo estimado: ${scheduleInfo.estimatedTripDuration}\n`;
		message += `📍 Número de estações: ${scheduleInfo.numberOfStations}\n`;

		if (scheduleInfo.nextSchedule1 || scheduleInfo.nextSchedule2) {
			message += "\n🔸 Próximos horários:\n";
			if (scheduleInfo.nextSchedule1) {
				message += `   • ${scheduleInfo.nextSchedule1}\n`;
			}
			if (scheduleInfo.nextSchedule2) {
				message += `   • ${scheduleInfo.nextSchedule2}\n`;
			}
		}

		message += "\n\nUse /horario para fazer uma nova consulta.";

		await ctx.reply(message);
	} catch (error) {
		const duration = Date.now() - startTime;
		logScheduleFetch(
			ctx.from?.id || 0,
			originId,
			destinationId,
			false,
			duration,
		);
		logError(ctx, error, "fetch_schedule");
		await ctx.reply("❌ Erro ao buscar horários. Tente novamente mais tarde.");
	}
}

/**
 * Handler para mensagens não reconhecidas
 */
bot.on("message", async (ctx) => {
	await ctx.reply(
		"🤔 Não entendi. Use /start para ver os comandos disponíveis.",
	);
});

/**
 * Error handler
 */
bot.catch((err) => {
	console.error("Bot error:", err);
});
