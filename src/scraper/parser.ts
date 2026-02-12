import * as cheerio from "cheerio";
import type { ScheduleInfo, Station } from "../types/index.ts";

export function parseCsrfToken(html: string): string | null {
	const $ = cheerio.load(html);
	const token = $('input[name="csrfmiddlewaretoken"]').val();

	if (typeof token === "string") {
		return token;
	}

	return null;
}

export function parseStations(html: string): Station[] {
	const $ = cheerio.load(html);
	const stations: Station[] = [];

	// Buscar estações do select de origem
	$('select[name="estacao_origem"] option').each((_, element) => {
		const $el = $(element);
		const id = $el.attr("value");
		const name = $el.text().trim();

		// Ignorar opção vazia ou com id 0
		if (id && id !== "0" && name) {
			stations.push({ id, name });
		}
	});

	return stations;
}

export function parseScheduleInfo(html: string): ScheduleInfo | null {
	const $ = cheerio.load(html);

	try {
		// O HTML tem um div com class "alert-info" que contém as informações
		const infoDiv = $(".alert-info");

		if (infoDiv.length === 0) {
			return null;
		}

		// Extrair título com origem e destino
		// Exemplo: "Viagem na LINHA SUL, entre: VIRGÍLIO TÁVORA e JUSCELINO KUBITSCHECK"
		const title = infoDiv.find("h6").text();
		const titleMatch = title.match(/entre:\s*(.+?)\s+e\s+(.+?)$/);
		const origin = titleMatch ? titleMatch[1]?.trim() : "";
		const destination = titleMatch ? titleMatch[2]?.trim() : "";

		// Extrair horário de saída da origem
		// Exemplo: "Próximo horário estimado na estação origem: 23:01h"
		const originTimeText = infoDiv
			.find("p:contains('Próximo horário estimado na estação origem')")
			.text();
		const originTimeMatch = originTimeText.match(/(\d{2}:\d{2})h/);
		const originEstimatedTime = originTimeMatch ? originTimeMatch[1] : "";

		// Extrair horário de chegada no destino
		// Exemplo: "Horário estimado de chegada na estação destino: 23:22h"
		const destTimeText = infoDiv
			.find("p:contains('Horário estimado de chegada na estação destino')")
			.text();
		const destTimeMatch = destTimeText.match(/(\d{2}:\d{2})h/);
		const destinationArrivalTime = destTimeMatch ? destTimeMatch[1] : "";

		// Extrair tempo estimado da viagem
		// Exemplo: "O tempo estimado da viagem é de 21 minutos"
		const durationText = infoDiv
			.find("p:contains('O tempo estimado da viagem')")
			.text();
		const durationMatch = durationText.match(/(\d+\s+minutos?)/);
		const estimatedTripDuration = durationMatch?.[1] ? durationMatch[1] : "";

		// Extrair número de estações
		// Exemplo: "Paradas entre origem e destino: 8"
		const stationsText = infoDiv
			.find("p:contains('Paradas entre origem e destino')")
			.text();
		const stationsMatch = stationsText.match(/:\s*(\d+)/);
		const numberOfStations = stationsMatch?.[1]
			? Number.parseInt(stationsMatch[1], 10)
			: 0;

		// Extrair próximos horários
		// Exemplo: "Próximos horários: 20:05h 20:27h "
		let nextSchedule1 = "";
		let nextSchedule2 = "";

		const nextSchedulesText = infoDiv
			.find("p:contains('Próximos horários')")
			.text();
		if (nextSchedulesText) {
			// Extrair todos os horários no formato HH:MMh
			const scheduleMatches = nextSchedulesText.match(/(\d{2}:\d{2})h/g);
			if (scheduleMatches && scheduleMatches.length > 0) {
				nextSchedule1 = scheduleMatches[0]?.replace("h", "") || "";
				nextSchedule2 = scheduleMatches[1]?.replace("h", "") || "";
			}
		}

		// Validar se conseguiu extrair dados essenciais
		if (!originEstimatedTime || !destinationArrivalTime) {
			return null;
		}

		return {
			originEstimatedTime,
			destinationArrivalTime,
			estimatedTripDuration,
			numberOfStations,
			nextSchedule1,
			nextSchedule2,
			origin: origin || "",
			destination: destination || "",
		};
	} catch (error) {
		console.error("Error parsing schedule info:", error);
		return null;
	}
}
