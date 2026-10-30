const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

/** Error thrown for non-2xx responses. Keeps the HTTP status and the Retry-After header. */
export class ApiError extends Error {
  constructor(status, message, retryAfterSeconds = null) {
    super(message);
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function request(path, userId, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new ApiError(0, `Cannot reach the server at ${API_URL}`);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const retryHeader = response.headers.get('Retry-After');
    const retryAfter = retryHeader ? Number(retryHeader) : data?.retryAfterSeconds ?? null;
    throw new ApiError(response.status, data?.message || response.statusText, retryAfter);
  }
  return data;
}

export const api = {
  generate: (userId, prompt) =>
    request('/api/ai/generate', userId, { method: 'POST', body: JSON.stringify({ prompt }) }),

  getStatus: (userId) => request('/api/quota/status', userId),

  getHistory: (userId) => request('/api/quota/history', userId),

  upgrade: (userId, plan, paymentReference) =>
    request('/api/quota/upgrade', userId, {
      method: 'POST',
      body: JSON.stringify({ plan, paymentReference }),
    }),
};
