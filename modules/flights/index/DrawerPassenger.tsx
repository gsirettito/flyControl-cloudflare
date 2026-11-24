import { DataTableRef, DataTable } from "@/components/DataTable";
import { FlightType } from "@/types/ModelsType";
import { Badge, Drawer, Flex, Stack, Tooltip } from "@mantine/core"
import { useRef } from "react";
import { getColumnsPassenger } from "./columns";
import { FiArrowRight } from "react-icons/fi";

export const DrawerPassenger = ({
    flight,
    opened,
    close
}: {
    flight: FlightType;
    opened: boolean;
    close: () => void
}) => {
    const tableRef = useRef<DataTableRef>(null);

    const columns = getColumnsPassenger();

    return (
        <Drawer opened={opened} onClose={close} title={"Listado de Pasajeros"} size={'lg'}>
            <Stack mb={20}>
                <Flex align={'center'} gap={4}>
                    <Tooltip label={`${flight.origin} (${flight.originName}) / ${flight.destination} (${flight.destinationName})`}>
                        <Badge>{flight.origin} <FiArrowRight /> {flight.destination} ({flight.flightNumber})</Badge>
                    </Tooltip>
                </Flex>
            </Stack>

            <DataTable
                key={"drawTable"}
                ref={tableRef}
                apiUrl={`/api/system/reservation/clients?flightId=${flight.id}`}
                columns={columns}
                initialParams={{
                    limit: 10,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                }}
                enableGlobalFilter={false}
            />
        </Drawer>
    )
}