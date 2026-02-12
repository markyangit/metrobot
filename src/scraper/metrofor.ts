import type { ScheduleInfo, Station } from "../types/index.ts";
import * as cache from "./cache.ts";
import { parseCsrfToken, parseScheduleInfo, parseStations } from "./parser.ts";

const BASE_URL = "https://info.metrofor.ce.gov.br";
const LINE_PK = "1"; // Linha Sul (hardcoded)

interface SessionData {
	csrfToken: string;
	cookies: string;
}

/**
 * Obtém o CSRF token e cookies da página inicial
 * Usa cache se disponível
 */
async function getSessionData(): Promise<SessionData> {
	// Verificar cache
	const cached = cache.get();
	if (cached?.csrfToken && cached?.cookies) {
		return {
			csrfToken: cached.csrfToken,
			cookies: cached.cookies,
		};
	}

	// Fazer requisição para obter novo token e cookies
	const response = await fetch(BASE_URL);

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const html = await response.text();
	const token = parseCsrfToken(html);

	if (!token) {
		throw new Error("Failed to extract CSRF token");
	}

	// Extrair cookies do header Set-Cookie
	const setCookieHeaders = response.headers.getSetCookie();
	const cookies = setCookieHeaders
		.map((cookie) => cookie.split(";")[0])
		.join("; ");

	if (!cookies) {
		throw new Error("Failed to extract cookies");
	}

	return {
		csrfToken: token,
		cookies,
	};
}

/**
 * Obtém o CSRF token da página inicial
 * Usa cache se disponível
 * @deprecated Use getSessionData() internally
 */
export async function getCsrfToken(): Promise<string> {
	const sessionData = await getSessionData();
	return sessionData.csrfToken;
}

/**
 * Obtém a lista de estações
 * Usa cache se disponível
 */
export async function getStations(): Promise<Station[]> {
	// Verificar cache
	const cached = cache.get();
	if (cached?.stations && cached.stations.length > 0) {
		return cached.stations;
	}

	// Obter sessão (token + cookies)
	const session = await getSessionData();

	// Fazer POST com origem=0 e destino=0 para obter formulário com estações
	const formData = new URLSearchParams({
		csrfmiddlewaretoken: session.csrfToken,
		pk: LINE_PK,
		estacao_origem: "0",
		estacao_destino: "0",
	});

	const response = await fetch(`${BASE_URL}/horarios`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Referer: BASE_URL,
			Cookie: session.cookies,
		},
		body: formData.toString(),
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const html = await response.text();
	const stations = parseStations(html);

	if (stations.length === 0) {
		throw new Error("Failed to extract stations list");
	}

	// Atualizar cache
	cache.set({
		csrfToken: session.csrfToken,
		cookies: session.cookies,
		stations,
	});

	return stations;
}

/**
 * Obtém informações de horários para uma viagem
 */
export async function getSchedules(
	originId: string,
	destinationId: string,
	dateTime?: string,
): Promise<ScheduleInfo | null> {
	// Obter sessão (token + cookies) do cache ou fazendo nova requisição
	const session = await getSessionData();

	// Preparar dados do formulário
	const formData = new URLSearchParams({
		csrfmiddlewaretoken: session.csrfToken,
		pk: LINE_PK,
		estacao_origem: originId,
		estacao_destino: destinationId,
	});

	// Adicionar data/hora se fornecido
	if (dateTime) {
		formData.append("dt_viagem", dateTime);
	}

	// Fazer requisição POST
	const response = await fetch(`${BASE_URL}/horarios`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Referer: BASE_URL,
			Cookie: session.cookies,
		},
		body: formData.toString(),
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const html = await response.text();

	// Parsear resposta
	const scheduleInfo = parseScheduleInfo(html);

	return scheduleInfo;
}
