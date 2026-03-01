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

const STORAGE_KEY = 'sovietpay_escrow_transactions';

class EscrowStore {
  private listeners: Set<() => void> = new Set();

  getTransactions(): EscrowTransaction[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const transactions = JSON.parse(stored) as Array<Omit<EscrowTransaction, 'createdAt' | 'completedAt'> & {
      createdAt: string;
      completedAt?: string;
    }>;
    return transactions.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
    }));
  }

  createTransaction(data: Omit<EscrowTransaction, 'id' | 'createdAt' | 'status'>): EscrowTransaction {
    const newTransaction: EscrowTransaction = {
      ...data,
      id: Date.now().toString(),
      status: 'frozen',
      createdAt: new Date(),
    };

    const transactions = this.getTransactions();
    transactions.unshift(newTransaction);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    this.notifyListeners();

    return newTransaction;
  }

  getUserTransactions(userEmail: string): EscrowTransaction[] {
    return this.getTransactions()
      .filter(t => t.tenantEmail === userEmail || t.recommenderEmail === userEmail)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  updateTransactionStatus(
    transactionId: string, 
    status: EscrowTransaction['status'],
    completedAt?: Date
  ): void {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === transactionId);
    if (index !== -1) {
      transactions[index].status = status;
      if (completedAt) {
        transactions[index].completedAt = completedAt;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      this.notifyListeners();
    }
  }

  getTransactionById(transactionId: string): EscrowTransaction | undefined {
    return this.getTransactions().find(t => t.id === transactionId);
  }

  getUserBalance(userEmail: string): {
    frozen: number;
    completed: number;
    pending: number;
  } {
    const transactions = this.getUserTransactions(userEmail);
    
    return {
      frozen: transactions
        .filter(t => t.status === 'frozen' && t.recommenderEmail === userEmail)
        .reduce((sum, t) => sum + t.commissionAmount, 0),
      completed: transactions
        .filter(t => t.status === 'completed' && t.recommenderEmail === userEmail)
        .reduce((sum, t) => sum + t.commissionAmount, 0),
      pending: transactions
        .filter(t => t.status === 'frozen' && t.tenantEmail === userEmail)
        .reduce((sum, t) => sum + t.commissionAmount, 0),
    };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const escrowStore = new EscrowStore();