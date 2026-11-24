import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useDebounce } from './useDebounce';

// Función que construye la URL desde apiUrl
async function fetchFromUrl(baseUrl: string, params: Record<string, any>) {
    const url = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, String(value));
        }
    });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

interface UseDataTableOptions {
    fetchDataFn?: (params: Record<string, any>) => Promise<any>;
}

export function useDataTable(
    apiUrl: string, // ahora obligatorio
    initialParams: Record<string, any> = {},
    forcedFilters: Record<string, any> = {},
    options: UseDataTableOptions = {}
) {
    const { fetchDataFn } = options;

    const getFetchFunction = () => {
        if (fetchDataFn) return fetchDataFn;
        // Siempre usa apiUrl
        return (params: Record<string, any>) => fetchFromUrl(apiUrl, params);
    };

    const {
        page: initialPage = 1,
        limit: initialLimit = 10,
        sortBy: initialSortBy = '',
        sortOrder: initialSortOrder = 'asc',
        include: initialInclude = '',
        ...initialFilters
    } = initialParams;

    const [params, setParams] = useState({
        page: initialPage,
        limit: initialLimit,
        sortBy: initialSortBy,
        sortOrder: initialSortOrder,
        include: initialInclude,
    });

    const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
    const [globalFilter, setGlobalFilter] = useState('');

    const debouncedGlobalFilter = useDebounce(globalFilter, 500);

    const buildQueryParams = () => {
        const query: Record<string, any> = {
            page: params.page,
            limit: params.limit,
        };
        if (params.sortBy) {
            query.sortBy = params.sortBy;
            query.sortOrder = params.sortOrder;
        }
        if (params.include) {
            query.include = params.include;
        }
        const allFilters = { ...filters, ...forcedFilters };
        Object.entries(allFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query[key] = value;
            }
        });
        if (debouncedGlobalFilter) {
            // Se mantiene la misma lógica (first_name:like). El usuario puede personalizarlo si necesita.
            query['first_name:like'] = debouncedGlobalFilter;
        }
        return query;
    };

    const fetchFn = getFetchFunction();

    // La queryKey ya no necesita el model, solo la apiUrl y los params
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: [apiUrl, buildQueryParams()],
        queryFn: () => fetchFn(buildQueryParams()),
        // keepPreviousData: true, // se puede descomentar si se desea
    });

    const handleSort = (columnId: string) => {
        const isAsc = params.sortBy === columnId && params.sortOrder === 'asc';
        setParams((prev) => ({
            ...prev,
            sortBy: columnId,
            sortOrder: isAsc ? 'desc' : 'asc',
            page: 1,
        }));
    };

    const handlePageChange = (newPage: number) => {
        setParams((prev) => ({ ...prev, page: newPage }));
    };

    const handleLimitChange = (newLimit: number) => {
        setParams((prev) => ({ ...prev, limit: newLimit, page: 1 }));
    };

    const setColumnFilter = (columnId: string, value: any) => {
        setFilters((prev) => ({ ...prev, [columnId]: value }));
        setParams((prev) => ({ ...prev, page: 1 }));
    };

    const updateFilters = (newFilters: Record<string, any>) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
        setParams((prev) => ({ ...prev, page: 1 }));
    };

    const resetFilters = () => {
        setFilters({});
        setGlobalFilter('');
        setParams((prev) => ({
            ...prev,
            page: 1,
            sortBy: '',
            sortOrder: 'asc',
        }));
    };

    return {
        data: data?.data || [],
        pagination: data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
        isLoading,
        error,
        refetch,
        handleSort,
        handlePageChange,
        handleLimitChange,
        setColumnFilter,
        setGlobalFilter,
        resetFilters,
        updateFilters,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        filters,
        globalFilter,
    };
}