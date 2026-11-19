import { requireRole, STAFF } from '../auth.js';

// Projects the team is working on.
export function exportRows(req) {
  requireRole(req, STAFF);
  return [
    { code: 'P-07', title: 'Shop renewal' },
    { code: 'P-09', title: 'Booking app' },
  ];
}
