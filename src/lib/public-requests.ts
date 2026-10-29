import funcUrls from "../../backend/func2url.json";
import {parseRequest, type Request} from "@/store/requestsStore";

const API_URL = funcUrls["requests-api"];

/** Request as the API returns it (JSON): createdAt is a string. */
export type RawRequest = Omit<Request, "createdAt"> & {createdAt: string};

/** Public list of active requests (the feed). Empty list on any error. */
export async function loadActiveRequests(): Promise<RawRequest[]> {
    try {
        const res = await fetch(`${API_URL}?status=active`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.requests || []) as RawRequest[];
    } catch {
        return [];
    }
}

/** Public single request. "missing" when the API says it does not exist. */
export async function loadRequestById(id: string): Promise<RawRequest | "missing" | null> {
    try {
        const res = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`);
        if (res.status === 404 || res.status === 400) return "missing";
        if (!res.ok) return null;
        const data = await res.json();
        return data.request ? (data.request as RawRequest) : "missing";
    } catch {
        return null;
    }
}

export function toRequests(raw: RawRequest[]): Request[] {
    return raw.map(parseRequest);
}
