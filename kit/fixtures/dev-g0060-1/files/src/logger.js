// The error log of the server. Tests read `logged`; the deployed server ships it to the log store.
export const logged = [];

export function logError(where, err) {
  logged.push({ where, detail: err instanceof Error ? err.stack : String(err) });
}
