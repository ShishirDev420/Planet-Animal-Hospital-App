export async function requestCareJson(url: string, init: RequestInit, options: { timeoutMs?: number; fetcher?: typeof fetch } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);
  try {
    const response = await (options.fetcher ?? fetch)(url, { ...init, signal: controller.signal });
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The care service is unavailable. General guides remain available; please retry recorded care later.');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The care request failed. Please retry.');
    return data;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('The care request timed out. Refresh your record before retrying a change. General guides remain available.');
    if (error instanceof TypeError) throw new Error('Unable to reach the care service. Check your connection and retry. General guides remain available.');
    throw error;
  } finally { clearTimeout(timer); }
}
