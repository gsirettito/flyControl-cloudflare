// flightradar24-client.d.ts
declare module "flightradar24-client" {
    export interface FlightInfo {
        id?: string;
        lat?: number;
        lon?: number;
        alt?: number;
        spd?: number;
        [key: string]: any;
    }
    export function fetchFlight(flightId: string): Promise<FlightInfo[]>;
}