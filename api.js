// Client for the ecp-api edge function (see ../API.md). With ?mock=1 every call goes to mock-api.js instead.
import { SUPABASE_URL, ANON_KEY } from './config.js';

export const MOCK = new URLSearchParams(location.search).get('mock') === '1';
const NO_SESSION = new Set(['brand', 'tablet-login', 'manager-login', 'm365-login']);

export class ApiError extends Error {
  constructor(status, body) {
    super((body && body.message) || 'Something went wrong. Please try again.');
    this.status = status;
    this.code = (body && body.error) || 'server';
    this.body = body || {};
  }
}

// kind: 'tablet' | 'manager' (which session token to send)
export async function call(route, body, token) {
  if (MOCK) {
    const { mockCall } = await import('./mock-api.js');
    return mockCall(route, body || {}, token);
  }
  const headers = { 'content-type': 'application/json', apikey: ANON_KEY };
  if (!NO_SESSION.has(route) && token) headers['x-ecp-session'] = token;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 45000);
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/ecp-api/${route}`, { method: 'POST', headers, body: JSON.stringify(body || {}), signal: ctl.signal });
  } catch (e) {
    throw new ApiError(0, { error: 'network', message: 'We could not reach the server. Check the connection and try again.' });
  } finally { clearTimeout(timer); }
  let data = null;
  try { data = await res.json(); } catch (e) { /* not JSON */ }
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
