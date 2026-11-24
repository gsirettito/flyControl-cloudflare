import { FilterChipPopover } from "@/components/FilterChipPopover";
import { DatesRangeValue } from "@mantine/dates";
import { useState } from "react";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { DateRangeFilter } from "@/components/FilterChipPopover/DateRangeFilter";

dayjs.extend(utc);

export const BarFilter = ({
    filterConfigs,
    filters,
    setColumnFilter
}: {
    filterConfigs: Array<any>;
    filters: Record<string, any>;
    setColumnFilter: (id: string, value: any) => void;
}) => {
    const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);

    const handleDateRangeChange = (range: DatesRangeValue<string>) => {
        setDateRange(range);
        if (range[0] && range[1]) {
            const start = dayjs(range[0]).utc().startOf('day').toISOString();
            const end = dayjs(range[1]).utc().endOf('day').toISOString();
            setColumnFilter('createdAt:between', `${start},${end}`);
        } else {
            setColumnFilter('createdAt:between', '');
        }
    };

    return (
        <>
            {filterConfigs.map((config) => {
                // Caso especial para el rango de fechas
                if (config.id === 'createdAt:between' || config.id === 'updatedAt:between')
                    return (
                        <FilterChipPopover
                            key={config.id}
                            label={config.label}
                            value={dateRange}               // ← estado local, no filtro
                            onChange={handleDateRangeChange} // ← manejador especial
                            formatActiveLabel={config.formatActiveLabel}
                            placeholder={config.placeholder}
                            closeOnChange={config.closeOnChange ?? true}
                            closeOnClickOutside={config.closeOnClickOutside ?? true}
                            clearable={config.clearable ?? false}
                        >
                            {(props) => <DateRangeFilter {...props} />}
                        </FilterChipPopover>
                    );

                const value = filters[config.id] || '';
                return (
                    <FilterChipPopover
                        key={config.id}
                        label={config.label}
                        value={value}
                        onChange={(val) => setColumnFilter(config.id, val)}
                        formatActiveLabel={config.formatActiveLabel}
                        placeholder={config.placeholder}
                        closeOnChange={config.closeOnChange ?? true}
                        closeOnClickOutside={config.closeOnClickOutside ?? true}
                        clearable={config.clearable ?? false}
                    >
                        {(props) => {
                            const Component = config.component as any;
                            return <Component {...props} {...config.componentProps} />
                        }}
                    </FilterChipPopover>
                );
            })}
        </>
    );
}