// modules/invoices/filterConfigs.ts
export const filterConfigs = [
    { id: 'invoiceNumber', label: 'Nº Factura', type: 'input' },
    { id: 'description', label: 'Descripción', type: 'input' },
    {
        id: 'status', label: 'Estado', type: 'select', options: [
            { value: 'PENDING', label: 'Pendiente' },
            { value: 'PAID', label: 'Pagada' }
        ]
    }
];