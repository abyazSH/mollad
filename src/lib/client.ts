export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}
export async function mutate(resource: string, data: unknown, method = 'POST') {
  const response = await fetch('/api/' + resource, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok)
    throw new ApiError(body.error || 'Terjadi kendala. Coba lagi.', body.code);
  return body;
}
