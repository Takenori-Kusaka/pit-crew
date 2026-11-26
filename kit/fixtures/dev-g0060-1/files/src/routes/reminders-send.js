// POST /reminders  (sends the reminder mails for one day)
export async function handle(req, deps) {
  const day = req.query?.date;
  if (!day) return { status: 400, body: { error: 'date is required' } };
  try {
    const sent = await deps.mailer.sendReminders(day);
    return { status: 200, body: { sent } };
  } catch (error) {
    return { status: 502, body: { message: 'could not send the reminders', reason: `${error}` } };
  }
}
