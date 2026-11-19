// The team's holiday calendar. Everyone, guests included, may see it.
export function exportRows(req) {
  return [
    { date: '2026-12-29', note: 'office closed' },
    { date: '2027-01-04', note: 'office reopens' },
  ];
}
