import funcUrls from "../../backend/func2url.json";
import { authStore } from "./authStore";

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { ...authStore.getAuthHeaders(), ...extra };
}

export interface Recommendation {
  id: string;
  userId: string;
  userName?: string;
  requestId?: string;
  requestName?: string;
  ownerEmail: string;
  inviteMessage: string;
  propertyData: {
    address: string;
    coordinates: [number, number];
    area: string;
    floor: string;
    totalFloors: string;
    rooms: string;
    hasFurniture: boolean;
    hasAppliances: boolean;
    rent: string;
    comments: string;
  };
  photos: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

const API_URL = funcUrls["recommendations-api"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRecommendation(raw: any): Recommendation {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
  };
}

class RecommendationsStore {
  private listeners: Set<() => void> = new Set();
  private cache: Recommendation[] = [];
  private userFetched: Set<string> = new Set();
  private requestFetched: Set<string> = new Set();

  getRecommendations(): Recommendation[] {
    return this.cache;
  }

  getUserRecommendations(userId: string): Recommendation[] {
    return this.cache.filter(r => r.userId === userId);
  }

  getRecommendationsByRequestId(requestId: string): Recommendation[] {
    return this.cache.filter(r => r.requestId === requestId);
  }

  getRecommendationById(recommendationId: string): Recommendation | undefined {
    return this.cache.find(r => r.id === recommendationId);
  }

  async fetchRecommendations(): Promise<Recommendation[]> {
    try {
      const res = await fetch(API_URL, { headers: authHeaders() });
      const data = await res.json();
      const fetched: Recommendation[] = (data.recommendations || []).map(parseRecommendation);
      this.mergeCache(fetched);
      this.notifyListeners();
      return fetched;
    } catch (e) {
      console.error(e);
      return this.cache;
    }
  }

  async fetchUserRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const res = await fetch(`${API_URL}?user_id=${encodeURIComponent(userId)}`, { headers: authHeaders() });
      const data = await res.json();
      const fetched: Recommendation[] = (data.recommendations || []).map(parseRecommendation);
      this.mergeCache(fetched);
      this.userFetched.add(userId);
      this.notifyListeners();
      return fetched;
    } catch (e) {
      console.error(e);
      return this.getUserRecommendations(userId);
    }
  }

  async fetchRecommendationsByRequestId(requestId: string): Promise<Recommendation[]> {
    try {
      const res = await fetch(`${API_URL}?request_id=${encodeURIComponent(requestId)}`, { headers: authHeaders() });
      const data = await res.json();
      const fetched: Recommendation[] = (data.recommendations || []).map(parseRecommendation);
      this.mergeCache(fetched);
      this.requestFetched.add(requestId);
      this.notifyListeners();
      return fetched;
    } catch (e) {
      console.error(e);
      return this.getRecommendationsByRequestId(requestId);
    }
  }

  async fetchRecommendationById(id: string): Promise<Recommendation | undefined> {
    try {
      const res = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.recommendation) {
        const parsed = parseRecommendation(data.recommendation);
        this.mergeSingle(parsed);
        this.notifyListeners();
        return parsed;
      }
      return undefined;
    } catch (e) {
      console.error(e);
      return this.getRecommendationById(id);
    }
  }

  async addRecommendation(recommendation: Omit<Recommendation, 'id' | 'createdAt' | 'status'>): Promise<Recommendation> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        userId: recommendation.userId,
        requestId: recommendation.requestId || undefined,
        requestName: recommendation.requestName,
        ownerEmail: recommendation.ownerEmail,
        inviteMessage: recommendation.inviteMessage,
        propertyData: recommendation.propertyData,
        photos: recommendation.photos,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.recommendation) {
      throw new Error(data.error || 'Ошибка создания рекомендации');
    }
    const newRecommendation = parseRecommendation(data.recommendation);
    this.cache.unshift(newRecommendation);
    this.notifyListeners();
    return newRecommendation;
  }

  async updateRecommendation(recommendationId: string, updates: Partial<Omit<Recommendation, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id: recommendationId, ...updates }),
    });
    const data = await res.json();
    if (data.recommendation) {
      const updated = parseRecommendation(data.recommendation);
      this.mergeSingle(updated);
      this.notifyListeners();
    }
  }

  async updateRecommendationStatus(recommendationId: string, status: 'pending' | 'accepted' | 'rejected'): Promise<void> {
    await this.updateRecommendation(recommendationId, { status });
  }

  async deleteRecommendation(recommendationId: string): Promise<void> {
    await fetch(`${API_URL}?id=${encodeURIComponent(recommendationId)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    this.cache = this.cache.filter(r => r.id !== recommendationId);
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  private mergeCache(items: Recommendation[]) {
    const map = new Map<string, Recommendation>();
    for (const r of this.cache) {
      map.set(r.id, r);
    }
    for (const r of items) {
      map.set(r.id, r);
    }
    this.cache = Array.from(map.values());
  }

  private mergeSingle(item: Recommendation) {
    const idx = this.cache.findIndex(r => r.id === item.id);
    if (idx !== -1) {
      this.cache[idx] = item;
    } else {
      this.cache.unshift(item);
    }
  }
}

export const recommendationsStore = new RecommendationsStore();