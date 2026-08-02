interface Env {
    BACKEND_ORIGIN?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const url = new URL(context.request.url);

    // Read backend origin URL strictly from Cloudflare environment variable
    // ZERO domain strings or hostnames are hardcoded in this codebase.
    const backendOrigin = context.env.BACKEND_ORIGIN?.trim().replace(/\/$/, '');

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

    const requestHeaders = new Headers(context.request.headers);

    try {
        const targetHost = new URL(rawOrigin).host;
        requestHeaders.set('Host', targetHost);
    } catch {}

    // Only attach body for HTTP methods that permit bodies (NOT GET or HEAD)
    const isBodyAllowed = !['GET', 'HEAD'].includes(context.request.method.toUpperCase());
    const requestBody = isBodyAllowed ? context.request.body : null;

    const modifiedRequest = new Request(targetUrl, {
        method: context.request.method,
        headers: requestHeaders,
        body: requestBody,
        redirect: 'follow',
    });

    try {
        const response = await fetch(modifiedRequest);
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
};

