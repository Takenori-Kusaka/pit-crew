// Job: add one address to the newsletter. Called with { db, email }.
export function run({ db, email }) {
  try {
    db.addSubscriber(email);
    return { status: 200, body: { ok: true } };
  } catch (err) {
    return { status: 500, body: { ok: false, error: String(err) } };
  }
}
