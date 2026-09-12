/**
 * Public client tag for the anonymous counter endpoint.
 *
 * It is not a credential: the same value ships inside every published build of
 * the extension, it grants no access to data or capabilities, and the endpoint
 * must not treat it as authentication. Rate limiting and de-duplication live on
 * the server; see SECURITY.md and docs/privacy.md.
 */
export const heartbeatApiKey = "0xathm93deqzsbw6u1folgj7kric4ynv";
