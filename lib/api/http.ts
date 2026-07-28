// Unified API response helpers so every route returns a consistent
// JSON shape: { error: string } on failure, { data: ... } on success.
// This lets the frontend read `data.error` the same way everywhere.

export function apiError(message: string, status = 400): Response {
    return Response.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status = 200): Response {
    return Response.json({ data }, { status });
}
