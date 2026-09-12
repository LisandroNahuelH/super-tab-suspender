/**
 * Test setup: cut the network.
 *
 * Product code is fire-and-forget over the wire (anonymous heartbeat on popup
 * open). Without this stub, any test that imports the popup module would reach
 * the real endpoint. Fail closed instead: replace fetch with a recorder that
 * answers 503, so the product's `if (!response.ok) return;` path runs and no
 * request ever leaves the machine.
 */
const stubbedCalls: Parameters<typeof fetch>[] = [];

const noNetworkFetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
  stubbedCalls.push(args);

  return {
    ok: false,
    status: 503,
    statusText: "Service Unavailable",
    json: async () => ({})
  } as unknown as Response;
};

(noNetworkFetch as unknown as { __noNetworkStub?: boolean }).__noNetworkStub = true;

globalThis.fetch = noNetworkFetch as unknown as typeof fetch;

export { stubbedCalls };
