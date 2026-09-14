import test from 'node:test';
import assert from 'node:assert/strict';
import { requestCareJson } from '../src/lib/care/request';
import { createCareHandler } from '../api/care';

test('hanging care request times out instead of leaving loading stuck', async () => {
  const fetcher = ((_url: string, init: RequestInit) => new Promise((_resolve, reject) => init.signal!.addEventListener('abort', () => reject(new Error('aborted'))))) as typeof fetch;
  await assert.rejects(requestCareJson('/api/care', {}, { fetcher, timeoutMs: 5 }), /timed out.*Refresh/);
});
test('HTML server failures and disconnected network stay explicit', async () => {
  await assert.rejects(requestCareJson('/api/care', {}, { fetcher: async () => new Response('<html>Error</html>', { status: 500, headers: { 'content-type': 'text/html' } }) }), /service is unavailable/);
  await assert.rejects(requestCareJson('/api/care', {}, { fetcher: async () => { throw new TypeError('Failed to fetch'); } }), /Check your connection/);
});
test('care endpoint rejects missing identity before accessing configuration or data', async () => {
  let accessed = false;
  const handler = createCareHandler(() => { accessed = true; throw Error('No config'); });
  const response: any = { setHeader() {}, end() {} };
  await handler({ method: 'GET', headers: {}, url: '/api/care' }, response);
  assert.equal(response.statusCode, 401);
  assert.equal(accessed, false);
});
