// Roles of the people who use the team's workspace. A guest is someone outside the team.
export const STAFF = ['admin', 'member'];

export class Forbidden extends Error {
  constructor() {
    super('forbidden');
    this.status = 403;
  }
}

// Throws Forbidden when the caller's role is not one of `roles`.
export function requireRole(req, roles) {
  if (!roles.includes(req.role)) throw new Forbidden();
}
