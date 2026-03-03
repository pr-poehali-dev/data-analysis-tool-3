import funcUrls from "../../backend/func2url.json";
import { authStore } from "./authStore";

export type RequestStatus = 'active' | 'in_progress' | 'archived';

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { ...authStore.getAuthHeaders(), ...extra };
}

export interface Request {
  id: string;
  userId: string;
  userEmail?: string;
  name: string;
  avatar: string;
  location: string;
  budget: string;
  reward: string;
  bonus: string;
  whoWillLive: string;
  aboutYourself: string;
  hasPets: string;
  city: string;
  districts: string[];
  budgetMin: string;
  budgetMax: string;
  housingType: string;
  roomsCount: string;
  rentalPeriod: string;
  moveInDate: string;
  status: RequestStatus;
  createdAt: Date;
}

const API_URL = funcUrls["requests-api"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRequest(raw: any): Request {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
  };
}

class RequestsStore {
  private listeners: Set<() => void> = new Set();
  private cache: Request[] = [];
  private fetched = false;
  private userFetched: Set<string> = new Set();

  getRequests(): Request[] {
    return this.cache;
  }

  getUserRequests(email: string): Request[] {
    return this.cache.filter(r => r.userId === email || r.userEmail === email);
  }

  getRequestById(requestId: string): Request | undefined {
    return this.cache.find(r => r.id === requestId);
  }

  async fetchRequests(): Promise<Request[]> {
    try {
      const res = await fetch(`${API_URL}?status=active`, { headers: authHeaders() });
      const data = await res.json();
      const fetched: Request[] = (data.requests || []).map(parseRequest);
      this.mergeCache(fetched);
      this.fetched = true;
      this.notifyListeners();
      return fetched;
    } catch (e) {
      console.error(e);
      return this.cache;
    }
  }

  async fetchAllRequests(): Promise<Request[]> {
    try {
      const res = await fetch(API_URL, { headers: authHeaders() });
      const data = await res.json();
      const fetched: Request[] = (data.requests || []).map(parseRequest);
      this.mergeCache(fetched);
      this.fetched = true;
      this.notifyListeners();
      return fetched;
    } catch (e) {
      console.error(e);
      return this.cache;
    }
  }

  async fetchUserRequests(email: string): Promise<Request[]> {
    try {
      const res = await fetch(`${API_URL}?user_email=${encodeURIComponent(email)}`, { headers: authHeaders() });
      const data = await res.json();
      const fetched: Request[] = (data.requests || []).map(parseRequest);
      this.mergeCache(fetched);
      this.userFetched.add(email);
      this.notifyListeners();
      return fetched;
    } catch (e) {
      console.error(e);
      return this.getUserRequests(email);
    }
  }

  async fetchRequestById(requestId: string): Promise<Request | undefined> {
    try {
      const res = await fetch(`${API_URL}?id=${encodeURIComponent(requestId)}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.request) {
        const parsed = parseRequest(data.request);
        this.mergeSingle(parsed);
        this.notifyListeners();
        return parsed;
      }
      return undefined;
    } catch (e) {
      console.error(e);
      return this.getRequestById(requestId);
    }
  }

  async addRequest(request: Omit<Request, 'id' | 'createdAt' | 'status'>): Promise<Request> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        userEmail: request.userId,
        name: request.name,
        avatar: request.avatar,
        location: request.location,
        budget: request.budget,
        reward: request.reward,
        bonus: request.bonus,
        whoWillLive: request.whoWillLive,
        aboutYourself: request.aboutYourself,
        hasPets: request.hasPets,
        city: request.city,
        districts: request.districts,
        budgetMin: request.budgetMin,
        budgetMax: request.budgetMax,
        housingType: request.housingType,
        roomsCount: request.roomsCount,
        rentalPeriod: request.rentalPeriod,
        moveInDate: request.moveInDate,
      }),
    });
    const data = await res.json();
    const newRequest = parseRequest(data.request);
    this.cache.unshift(newRequest);
    this.notifyListeners();
    return newRequest;
  }

  async updateRequest(requestId: string, updates: Partial<Omit<Request, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id: requestId, ...updates }),
    });
    const data = await res.json();
    if (data.request) {
      const updated = parseRequest(data.request);
      this.mergeSingle(updated);
      this.notifyListeners();
    }
  }

  async updateRequestStatus(requestId: string, status: RequestStatus): Promise<void> {
    await this.updateRequest(requestId, { status });
  }

  async deleteRequest(requestId: string): Promise<void> {
    await fetch(`${API_URL}?id=${encodeURIComponent(requestId)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    this.cache = this.cache.filter(r => r.id !== requestId);
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  private mergeCache(items: Request[]) {
    const map = new Map<string, Request>();
    for (const r of this.cache) {
      map.set(r.id, r);
    }
    for (const r of items) {
      map.set(r.id, r);
    }
    this.cache = Array.from(map.values());
  }

  private mergeSingle(item: Request) {
    const idx = this.cache.findIndex(r => r.id === item.id);
    if (idx !== -1) {
      this.cache[idx] = item;
    } else {
      this.cache.unshift(item);
    }
  }
}

export const requestsStore = new RequestsStore();