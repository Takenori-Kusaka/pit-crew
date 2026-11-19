import * as contacts from './exports/contacts.js';
import * as holidays from './exports/holidays.js';
import * as invoices from './exports/invoices.js';
import * as projects from './exports/projects.js';
import * as timesheets from './exports/timesheets.js';

const EXPORTS = { contacts, holidays, invoices, projects, timesheets };

export const exportNames = () => Object.keys(EXPORTS);

// One download of the export `name` for the caller `req` ({ role }).
export function handleExport(name, req) {
  const mod = EXPORTS[name];
  if (!mod) return { status: 404, body: { error: 'not found' } };
  try {
    return { status: 200, body: mod.exportRows(req) };
  } catch (e) {
    if (e.status === 403) return { status: 403, body: { error: 'forbidden' } };
    throw e;
  }
}
