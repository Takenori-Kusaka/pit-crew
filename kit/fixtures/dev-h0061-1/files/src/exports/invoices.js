// Invoices sent to clients this month.
export function exportRows(req) {
  return [
    { no: 'INV-1031', client: 'North Hill Ltd', amount: 420000 },
    { no: 'INV-1032', client: 'Riverside Studio', amount: 185000 },
  ];
}
