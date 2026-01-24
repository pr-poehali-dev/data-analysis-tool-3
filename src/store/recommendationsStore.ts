export interface Recommendation {
  id: string;
  userId: string;
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

const STORAGE_KEY = 'sovietpay_recommendations';

class RecommendationsStore {
  private listeners: Set<() => void> = new Set();

  getRecommendations(): Recommendation[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const recommendations = JSON.parse(stored);
    return recommendations.map((r: any) => ({
      ...r,
      createdAt: new Date(r.createdAt)
    }));
  }

  addRecommendation(recommendation: Omit<Recommendation, 'id' | 'createdAt' | 'status'>): Recommendation {
    const newRecommendation: Recommendation = {
      ...recommendation,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date(),
    };
    
    const recommendations = this.getRecommendations();
    recommendations.unshift(newRecommendation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recommendations));
    this.notifyListeners();
    
    return newRecommendation;
  }

  getUserRecommendations(userId: string): Recommendation[] {
    return this.getRecommendations().filter(r => r.userId === userId);
  }

  deleteRecommendation(recommendationId: string): void {
    const recommendations = this.getRecommendations().filter(r => r.id !== recommendationId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recommendations));
    this.notifyListeners();
  }

  updateRecommendationStatus(recommendationId: string, status: 'pending' | 'accepted' | 'rejected'): void {
    const recommendations = this.getRecommendations();
    const index = recommendations.findIndex(r => r.id === recommendationId);
    if (index !== -1) {
      recommendations[index].status = status;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recommendations));
      this.notifyListeners();
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const recommendationsStore = new RecommendationsStore();
