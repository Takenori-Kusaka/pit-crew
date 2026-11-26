// GET /invoices/:id
export async function handle(req, deps) {
  try {
    const invoice = await deps.invoices.find(req.params.id);
    if (!invoice) return { status: 404, body: { error: 'invoice not found' } };
    return { status: 200, body: invoice };
  } catch (e) {
    return { status: 500, body: { error: 'could not load the invoice', detail: e.stack } };
  }
}
