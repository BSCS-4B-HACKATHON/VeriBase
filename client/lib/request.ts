import { BE_URL } from "@/lib/helpers";

export async function getRequestById(address: string, requestId: string) {
    if (!address) throw new Error("no wallet address available");

    const url = `${BE_URL}/api/requests/${encodeURIComponent(
        address
    )}/${encodeURIComponent(requestId)}`;
    const res = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
        // include cookies if your server uses session auth
        credentials: "include",
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`request fetch failed: ${res.status} ${body}`);
    }

    const payload = await res.json(); // { ok: true, request: {...} }
    return payload.request;
}
