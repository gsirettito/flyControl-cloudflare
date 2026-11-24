# 📊 Componente `DataTable` – README

El componente `DataTable` es una tabla de datos genérica y altamente configurable. Está construida sobre `@tanstack/react-table`, utiliza Mantine para la UI y se conecta al **endpoint genérico de modelos** (`/api/system/model/:model`) para obtener los datos con paginación, ordenamiento, filtros, selección de filas, exportación a Excel y mucho más.

## 📦 Instalación y dependencias

Asegúrate de tener instalados los paquetes necesarios:

```bash
yarn add @tanstack/react-table @tanstack/react-query @mantine/core @mantine/dates dayjs xlsx
```

## 🧩 Props del `DataTable`

| Prop                         | Tipo                                                              | Descripción                                                                                   | Ejemplo                                                   |
|------------------------------|-------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| `model`                      | `string`                                                          | Nombre del modelo (debe estar en `allowedModels` del endpoint).                               | `"user"`                                                  |
| `columns`                    | `ColumnDef<T>[]`                                                  | Definición de columnas (de `@tanstack/react-table`).                                          | `getColumns(handleEdit, handleDelete)`                    |
| `initialParams`              | `Record<string, any>`                                             | Parámetros iniciales (paginación, orden, filtros, includes).                                  | `{ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }`   |
| `globalFilterPlaceholder`    | `string`                                                          | Placeholder para la búsqueda global (si `enableGlobalFilter` es `true`).                      | `"Buscar..."`                                             |
| `enableGlobalFilter`         | `boolean`                                                         | Muestra / oculta el input de búsqueda global. Por defecto `true`.                             | `true`                                                    |
| `renderFilters`              | `(filters, setColumnFilter) => ReactNode`                         | Función que renderiza los filtros personalizados (chips).                                     | `(f, s) => <FilterChipPopover ... />`                     |
| `onSelectedRowsChange`       | `(selectedRows: any[]) => void`                                   | Callback que se ejecuta cuando cambia la selección de filas (checkboxes).                     | `(rows) => setSelectedUsers(rows)`                        |

## 🔁 Ref / Métodos expuestos

El componente expone un `ref` con el método `refresh`. Puedes usarlo para recargar los datos (por ejemplo tras una creación/edición/eliminación).

```tsx
const tableRef = useRef<DataTableRef>(null);

// Recargar sin cambiar filtros
tableRef.current?.refresh();

// Recargar aplicando nuevos filtros (fusiona con los existentes)
tableRef.current?.refresh({ 'status:like': 'VERIFIED' });
```

## 📌 Uso básico

```tsx
import { DataTable, DataTableRef } from '@/components/DataTable';
import { getColumns } from './columns';
import { useRef } from 'react';

export function MyList() {
  const tableRef = useRef<DataTableRef>(null);
  const columns = getColumns(handleEdit, handleDelete);

  return (
    <DataTable
      ref={tableRef}
      model="user"
      columns={columns}
      initialParams={{ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }}
      onSelectedRowsChange={(rows) => console.log('Seleccionados:', rows)}
    />
  );
}
```

## 🎛️ Filtros personalizados (Chips)

El componente acepta una función `renderFilters` que recibe el objeto `filters` y la función `setColumnFilter`. Típicamente se usa junto con `<FilterChipPopover>` y componentes filtro como `InputFilter`, `SelectFilter`, `DateRangeFilter`, `NumberRangeFilter`, `BooleanFilter`.

### Ejemplo de configuración de filtros (`filterConfigs.ts`)

```ts
export const filterConfigs = [
  {
    id: 'first_name:like',
    label: 'Nombre',
    placeholder: 'Ej: Juan',
    component: InputFilter,
    formatActiveLabel: (val) => `Nombre: ${val}`,
    closeOnChange: false,
  },
  {
    id: 'status',
    label: 'Estado',
    component: SelectFilter,
    componentProps: { data: ['ACTIVO', 'INACTIVO'] },
    formatActiveLabel: (val) => `Estado: ${val}`,
  },
  {
    id: 'createdAt:between',
    label: 'Rango de fechas',
    component: DateRangeFilter,
    formatActiveLabel: (val) => `${val[0]} → ${val[1]}`,
    closeOnChange: false,
    closeOnClickOutside: false,
  },
];
```

### Uso de `renderFilters`

```tsx
<DataTable
  renderFilters={(filters, setColumnFilter) => (
    <>
      {filterConfigs.map((cfg) => {
        if (cfg.id === 'createdAt:between') {
          return (
            <FilterChipPopover
              key={cfg.id}
              label={cfg.label}
              value={dateRange}         // estado local
              onChange={handleDateRangeChange}
              formatActiveLabel={cfg.formatActiveLabel}
              {...cfg}
            >
              {(props) => <DateRangeFilter {...props} />}
            </FilterChipPopover>
          );
        }
        return (
          <FilterChipPopover
            key={cfg.id}
            label={cfg.label}
            value={filters[cfg.id] ?? ''}
            onChange={(val) => setColumnFilter(cfg.id, val)}
            formatActiveLabel={cfg.formatActiveLabel}
            {...cfg}
          >
            {(props) => <cfg.component {...props} {...cfg.componentProps} />}
          </FilterChipPopover>
        );
      })}
    </>
  )}
/>
```

## 📥 Exportar datos

El botón de exportación ya está integrado en la barra superior. Abre un modal donde el usuario puede:

- Seleccionar intervalo de fechas (Hoy, Mes en curso, Últimos 7 días, Personalizado…)
- Escoger las columnas a exportar
- Descargar un archivo Excel (`.xlsx`) con todos los registros (sin paginación) que cumplan los filtros activos.

La exportación utiliza la misma lógica de filtros del `DataTable` y respeta las relaciones (`include`).

## 🧱 Definición de columnas

Cada columna debe definirse con `createColumnHelper` y puede incluir las propiedades:

- `header`: texto o componente del encabezado.
- `cell`: función de renderizado.
- `enableSorting`: si la columna permite ordenamiento.
- `meta.sticky`: `'left'` o `'right'` para fijar columnas al desplazamiento horizontal.
- `meta.stickyOffset`: desplazamiento adicional (útil para múltiples columnas pegadas).

La columna de selección (`select`) y la de acciones se añaden automáticamente desde la función `getColumns` que exportes.

### Ejemplo de `columns.tsx` con acciones y sticky

```ts
export const getColumns = (onEdit, onDelete) => [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => <Checkbox ... />,
    cell: ({ row }) => <Checkbox ... />,
    meta: { sticky: 'left', stickyOffset: 0 },
  }),
  columnHelper.accessor('name', {
    header: 'Nombre',
    enableSorting: true,
    meta: { sticky: 'left', stickyOffset: 34 },
  }),
  // ... más columnas
  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => ( ... menu de acciones ... ),
    meta: { sticky: 'right' },
  }),
];
```

## ⚙️ El hook `useDataTable`

El `DataTable` utiliza internamente el hook `useDataTable`, que es quien:

- Gestiona los parámetros de página, límite, orden, filtros y búsqueda global.
- Realiza las peticiones al endpoint con `react-query`.
- Expone `refetch`, `updateFilters`, etc.

Si necesitas usar la tabla sin el componente visual, puedes importar el hook directamente.

## 🧪 Probando el DataTable

```tsx
// Ejemplo completo en una página
<DataTable
  model="user"
  columns={columns}
  initialParams={{
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    include: 'type',               // incluye relación 'type'
    'email:like': 'gmail',         // filtro inicial (se mostrará en la URL)
  }}
  renderFilters={renderCustomFilters}
  onSelectedRowsChange={(selected) => console.log(selected)}
/>
```

## 📄 Notas adicionales

- Los filtros con `:like` se envían al servidor como `{ contains: valor, mode: 'insensitive' }`.
- Para campos `enum` (ej. `status`), no uses `:like`; usa igualdad simple (`id: 'status'`).
- Las fechas en el rango `:between` deben enviarse en UTC (el cliente ya lo hace con `dayjs().utc().toISOString()`).
- Si deseas ordenamiento por defecto, usa `sortBy` y `sortOrder` en `initialParams`.
- El botón "Limpiar filtros" resetea todos los filtros (incluyendo los iniciales) y ordenamiento.
