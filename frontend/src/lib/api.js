/**
 * Thin fetch wrapper for the ShiftProof API.
 *
 * The session lives in httpOnly cookies the browser sends automatically, so
 * no token is ever read, written or stored in JavaScript. Every call goes to
 * /api on this origin (Vite proxy in dev, Vercel routing in production) -
 * there is no API URL to configure.
 */

export class ApiError extends Error {
  constructor(status, message, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

let onUnauthorized = null;

/** AuthContext subscribes so any 401 signs the user out locally. */
export function setOnUnauthorized(handler) {
  onUnauthorized = handler;
}

/**
 * request('/api/shifts', { method: 'POST', body }) -> parsed JSON
 * Throws ApiError { status, message, errors } on failure.
 */
export async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // empty or non-JSON body is fine on success
  }

  if (response.ok) return data;

  const errors = Array.isArray(data?.errors) ? data.errors : [];
  const message = errors.length > 0
    ? errors.map((e) => `${e.field}: ${e.message}`).join('; ')
    : (typeof data?.detail === 'string' ? data.detail : 'Something went wrong');
  if (response.status === 401 && onUnauthorized) onUnauthorized();
  throw new ApiError(response.status, message, errors);
}
