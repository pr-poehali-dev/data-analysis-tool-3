import type { TypingStatus } from "./types";

const TYPING_STORAGE_KEY = 'sovietpay_typing';

export class TypingManager {
  private onChanged: () => void;

  constructor(onChanged: () => void) {
    this.onChanged = onChanged;
  }

  setTyping(chatId: string, userEmail: string, userName: string): void {
    if (typeof window === 'undefined') return;
    const statuses = this.getStatuses();
    const idx = statuses.findIndex(
      t => t.chatId === chatId && t.userEmail === userEmail
    );
    const entry: TypingStatus = { chatId, userEmail, userName, timestamp: Date.now() };
    if (idx !== -1) {
      statuses[idx] = entry;
    } else {
      statuses.push(entry);
    }
    localStorage.setItem(TYPING_STORAGE_KEY, JSON.stringify(statuses));
    this.onChanged();
  }

  clearTyping(chatId: string, userEmail: string): void {
    if (typeof window === 'undefined') return;
    const filtered = this.getStatuses().filter(
      t => !(t.chatId === chatId && t.userEmail === userEmail)
    );
    localStorage.setItem(TYPING_STORAGE_KEY, JSON.stringify(filtered));
    this.onChanged();
  }

  getTypingUsers(chatId: string, excludeUserEmail: string): string[] {
    const now = Date.now();
    return this.getStatuses()
      .filter(t => t.chatId === chatId && t.userEmail !== excludeUserEmail && (now - t.timestamp) < 5000)
      .map(t => t.userName);
  }

  cleanup(): void {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    const filtered = this.getStatuses().filter(t => (now - t.timestamp) < 10000);
    localStorage.setItem(TYPING_STORAGE_KEY, JSON.stringify(filtered));
  }

  private getStatuses(): TypingStatus[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(TYPING_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  }
}
