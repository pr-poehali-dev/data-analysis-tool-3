import funcUrls from "../../backend/func2url.json";

const API_URL = funcUrls["escrow-api"];

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

  async fetchUserTransactions(userEmail: string): Promise<EscrowTransaction[]> {
    try {
      const res = await fetch(`${API_URL}?action=list&email=${encodeURIComponent(userEmail)}`);
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

  async fetchUserBalance(userEmail: string): Promise<EscrowBalance> {
    try {
      const res = await fetch(`${API_URL}?action=balance&email=${encodeURIComponent(userEmail)}`);
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: transactionId, status }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Ошибка обновления статуса');
    }
    this.notifyListeners();
  }

  async hasActiveTransactionForChat(chatId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}?action=check-chat&chatId=${encodeURIComponent(chatId)}`);
      const data = await res.json();
      return data.hasActive === true;
    } catch {
      return false;
    }
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