import { Progress, Stack } from "@mantine/core"
import { FlightSearchCard } from "./FlightSearchCard"
import { SearchResultsList } from "./SearchResultsList"
import { useState } from "react";
import { FlightType } from "@/types/ModelsType";
import { UseFormSetValue } from "react-hook-form";
import { ensureAirlineExists } from "./utils";

type Props = {
    setValue: UseFormSetValue<FlightType>;
    onReadyCreate: (state: boolean) => void
}

export const TabFlightAutomatic = ({ setValue, onReadyCreate }: Props) => {
    const [loading, setLoading] = useState(false)
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedFlightIndex, setSelectedFlightIndex] = useState<number | null>(null);

    const handleSelectFlight = (flight: any, index: number) => {
        setLoading(true)
        onReadyCreate(false)
        setSelectedFlightIndex(index)
        setValue('flightNumber', flight.flightNumber);
        setValue('origin', flight.origin);
        setValue('destination', flight.destination);
        setValue('originName', flight.originName);
        setValue('destinationName', flight.destinationName);
        if (flight.departureUtc) setValue('departureTime', flight.departureUtc);
        if (flight.arrivalUtc) setValue('arrivalTime', flight.arrivalUtc);
        setValue('originTimezone', flight.originTimezone || null);
        setValue('destinationTimezone', flight.destinationTimezone || null);
        ensureAirlineExists(flight.airlineIata).then(airlineId => {
            if (airlineId) setValue('airlineId', airlineId);
            onReadyCreate(true);
        }).finally(() => {
            setLoading(false)
        });
    }

    return (
        <Stack>
            <FlightSearchCard onSearchChange={(search: any[]) => setSearchResults(search)} />
            <SearchResultsList
                searchResults={searchResults}
                selectedFlightIndex={selectedFlightIndex}
                onSelect={handleSelectFlight}
            />
            {loading && <Progress
                value={100}
                striped
                animated
                color="primary"
                size="sm"
                radius="xl"
            />}
        </Stack>
    )
}