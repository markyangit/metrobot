export interface Station {
	id: string;
	name: string;
}

export interface ScheduleInfo {
	originEstimatedTime: string;
	destinationArrivalTime: string;
	estimatedTripDuration: string;
	numberOfStations: number;
	nextSchedule1: string;
	nextSchedule2: string;
	origin: string;
	destination: string;
}

export interface CacheData {
	csrfToken: string;
	cookies: string;
	stations: Station[];
	timestamp: number;
}
