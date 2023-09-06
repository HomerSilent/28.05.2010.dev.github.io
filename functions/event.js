export async function onRequestPost({ request, waitUntil, passThroughOnException }) {
    passThroughOnException();
    const newRequest = new Request(request);
    waitUntil(await fetch('https://analytics.is-a.dev/api/event', newRequest));
    return new Response('OK', { status: 202 });
};
