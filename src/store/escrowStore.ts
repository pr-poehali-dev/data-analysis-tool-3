import funcUrls from "../../backend/func2url.json";
import { authStore } from "./authStore";

const API_URL = funcUrls["escrow-api"];

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { ...authStore.getAuthHeaders(), ...extra };
}

export interface EscrowTransaction {
  id: string;
  chatId: string;
  recommendationId: string;
  requestName: string;
  tenantEmail: string;
  tenantName: string;
  recommenderEmail: string;
  recommenderName: string;
  rentAmount: number;
  commissionAmount: number;
  status: 'pending' | 'frozen' | 'completed' | 'cancelled' | 'refunded';
  createdAt: Date;
  completedAt?: Date;
}

export interface EscrowBalance {
  frozen: number;
  completed: number;
  pending: number;
  sent: number;
}

class EscrowStore {
  private listeners: Set<() => void> = new Set();

  async fetchUserTransactions(): Promise<EscrowTransaction[]> {
    try {
      const res = await fetch(`${API_URL}?action=list`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) return [];
      return (data.transactions || []).map((t: Record<string, unknown>) => ({
        ...t,
        createdAt: t.createdAt ? new Date(t.createdAt as string) : new Date(),
        completedAt: t.completedAt ? new Date(t.completedAt as string) : undefined,
      }));
    } catch {
      return [];
    }
  }

  async fetchUserBalance(): Promise<EscrowBalance> {
    try {
      const res = await fetch(`${API_URL}?action=balance`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) return { frozen: 0, completed: 0, pending: 0, sent: 0 };
      return {
        frozen: data.frozen || 0,
        completed: data.completed || 0,
        pending: data.pending || 0,
        sent: data.sent || 0,
      };
    } catch {
      return { frozen: 0, completed: 0, pending: 0, sent: 0 };
    }
  }

  async createTransaction(data: Omit<EscrowTransaction, 'id' | 'createdAt' | 'status'>): Promise<EscrowTransaction> {
    const res = await fetch(`${API_URL}?action=create`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Ошибка создания транзакции');

    const transaction: EscrowTransaction = {
      ...data,
      id: result.id,
      status: 'frozen',
      createdAt: new Date(result.createdAt),
    };
    this.notifyListeners();
    return transaction;
  }

  async updateTransactionStatus(
    transactionId: string,
    status: EscrowTransaction['status'],
  ): Promise<void> {
    const res = await fetch(`${API_URL}?action=update-status`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id: transactionId, status }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Ошибка обновления статуса');
    }
    this.notifyListeners();
  }

  async getEscrowStatusForChat(chatId: string): Promise<{ hasActive: boolean; transactionId?: string; status?: string; commissionAmount?: number }> {
    try {
      const res = await fetch(`${API_URL}?action=check-chat&chatId=${encodeURIComponent(chatId)}`, { headers: authHeaders() });
      const data = await res.json();
      return data;
    } catch {
      return { hasActive: false };
    }
  }

  async hasActiveTransactionForChat(chatId: string): Promise<boolean> {
    const data = await this.getEscrowStatusForChat(chatId);
    return data.hasActive === true;
  }

  getUserTransactions(userEmail: string): EscrowTransaction[] {
    return [];
  }

  getUserBalance(userEmail: string): EscrowBalance {
    return { frozen: 0, completed: 0, pending: 0, sent: 0 };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const escrowStore = new EscrowStore();