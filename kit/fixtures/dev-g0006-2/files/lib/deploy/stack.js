// The cloud stack: the environment the receiving function gets at start-up.
// param(path) is read from the parameter store at deploy time; the value never appears here.
export const param = (path) => ({ fromParameter: path });

export function functionEnvironment() {
  return {
    NODE_ENV: 'production',
    BOOKING_TIMEZONE: 'Asia/Tokyo',
    DATABASE_URL: param('/booking-hooks/prod/db-url'),
  };
}
