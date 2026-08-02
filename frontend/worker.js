/**
 * Cloudflare Worker entry point.
 *
 * Invoked for /api/* requests (via run_worker_first in wrangler.json).
 * Proxies API calls to the backend origin (BACKEND_ORIGIN env var).
 * Static assets (the React SPA) are served automatically by Cloudflare's
 * asset handler for all other routes.
 *
 * ZERO domain strings or hostnames are hardcoded in this file.
 */
export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // This worker is only invoked for /api/* via run_worker_first config,
        // but guard anyway for safety.
        if (!url.pathname.startsWith('/api/')) {
            return env.ASSETS.fetch(request);
        }

        // Read backend origin from Cloudflare environment variable
        const backendOrigin = (env.BACKEND_ORIGIN || '').trim().replace(/\/$/, '');

        if (!backendOrigin) {
            return new Response(
                JSON.stringify({ detail: 'BACKEND_ORIGIN environment variable is required but not configured' }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        let rawOrigin = backendOrigin;

        // Normalize origin if /api/v0 or /api is included in BACKEND_ORIGIN variable
        if (rawOrigin.endsWith('/api/v0')) {
            rawOrigin = rawOrigin.slice(0, -'/api/v0'.length);
        } else if (rawOrigin.endsWith('/api')) {
            rawOrigin = rawOrigin.slice(0, -'/api'.length);
        }

        const targetUrl = `${rawOrigin}${url.pathname}${url.search}`;

        const requestHeaders = new Headers(request.headers);

        try {
            const targetHost = new URL(rawOrigin).host;
            requestHeaders.set('Host', targetHost);
        } catch {}

        // Only attach body for HTTP methods that permit bodies (NOT GET or HEAD)
        const isBodyAllowed = !['GET', 'HEAD'].includes(request.method.toUpperCase());
        const requestBody = isBodyAllowed ? request.body : null;

        const proxyRequest = new Request(targetUrl, {
            method: request.method,
            headers: requestHeaders,
            body: requestBody,
            redirect: 'follow',
        });

        try {
            const response = await fetch(proxyRequest);
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            });
        } catch (error) {
            return new Response(
                JSON.stringify({ detail: 'Backend origin proxy error' }),
                {
                    status: 502,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }
    },
};
