export const getDateInLocalTimezone = (dateUtc: string, timezone: string) => {
    const date = new Date(dateUtc);
    const options = { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true } as any;
    return date.toLocaleString('en-US', options);
};

export const flightStatusFilter = (status: string) => {
    if (status.includes("Landed")) return `Aterrizado ${status.split("Landed")[1]}`;
    if (status == 'Scheduled') return `Programado`;
    if (status.includes("Estimated")) return `Tiempo estimado`;
    return status;
};

export const ensureAirlineExists = async (airlineIdentifier: string): Promise<string | null> => {
    try {
        const params = new URLSearchParams({ page: "1", limit: "1", sortBy: "createdAt", sortOrder: "desc", "iata:like": airlineIdentifier });
        const response = await fetch(`/api/system/airlines?${params.toString()}`);
        if (response.ok) {
            const result = await response.json();
            const item = result.data?.[0];
            if (item) {
                const newAirline = { value: item.id, label: `${item.displayName} (${item.iata})` };
                return newAirline.value;
            }
        }
    } catch (error) { console.error("Error al buscar aerolínea:", error); }
    return null;
};

export const getTimezoneOffsetMs = (timezone: string, date: Date) => {
    try {
        const options = { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false } as any;
        const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
        const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
        const year = get('year'); const month = get('month') - 1; const day = get('day');
        let hour = get('hour'); if (hour === 24) hour = 0;
        const minute = get('minute'); const second = get('second');
        const localAsBrowser = new Date(year, month, day, hour, minute, second);
        return localAsBrowser.getTime() - date.getTime();
    } catch (e) { return 0; }
};