import funcUrls from "../../backend/func2url.json";
import { parseChat, parseMessage } from "./messages/types";
import { TypingManager } from "./messages/typingManager";
import { authStore } from "./authStore";
import type { Chat, Message } from "./messages/types";

export type { Chat, Message } from "./messages/types";

const API_URL = (funcUrls as Record<string, string>)["messages-api"];

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { ...authStore.getAuthHeaders(), ...extra };
}

class MessagesStore {
  private listeners: Set<() => void> = new Set();
  private chatsCache: Chat[] = [];
  private messagesCache: Map<string, Message[]> = new Map();
  private loading = false;
  private typing: TypingManager;

  constructor() {
    this.typing = new TypingManager(() => this.notifyListeners());
  }

  async fetchUserChats(): Promise<Chat[]> {
    try {
      const res = await fetch(API_URL, { headers: authHeaders() });
      if (!res.ok) {
        authStore.handleUnauthorized(res);
        return this.chatsCache;
      }
      const data = await res.json();
      this.chatsCache = (data.chats || []).map(parseChat);
      this.notifyListeners();
      return this.chatsCache;
    } catch (e) {
      console.error('fetchUserChats error:', e);
      return this.chatsCache;
    }
  }

  getUserChats(userEmail: string): Chat[] {
    return this.chatsCache
      .filter(c => c.recommenderEmail === userEmail || c.tenantEmail === userEmail)
      .sort((a, b) => {
        const timeA = a.lastMessageTime?.getTime() || a.createdAt.getTime();
        const timeB = b.lastMessageTime?.getTime() || b.createdAt.getTime();
        return timeB - timeA;
      });
  }

  getChats(): Chat[] {
    return this.chatsCache;
  }

  getChatByRecommendation(recommendationId: string): Chat | undefined {
    return this.chatsCache.find(c => c.recommendationId === recommendationId);
  }

  async fetchChatByRecommendation(recommendationId: string): Promise<Chat | undefined> {
    try {
      const res = await fetch(`${API_URL}?action=chat_by_recommendation&recommendation_id=${encodeURIComponent(recommendationId)}`, { headers: authHeaders() });
      if (!res.ok) return undefined;
      const data = await res.json();
      if (data.chat) {
        const chat = parseChat(data.chat);
        const idx = this.chatsCache.findIndex(c => c.id === chat.id);
        if (idx >= 0) this.chatsCache[idx] = chat;
        else this.chatsCache.push(chat);
        this.notifyListeners();
        return chat;
      }
      return undefined;
    } catch (e) {
      console.error('fetchChatByRecommendation error:', e);
      return undefined;
    }
  }

  async createChat(data: Omit<Chat, 'id' | 'createdAt' | 'unreadCount'>): Promise<Chat> {
    const existing = this.getChatByRecommendation(data.recommendationId);
    if (existing) return existing;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          recommendationId: data.recommendationId,
          requestId: data.requestId,
          requestName: data.requestName,
          recommenderEmail: data.recommenderEmail,
          recommenderName: data.recommenderName,
          recommenderPhoto: data.recommenderPhoto || '',
          recommenderVkLink: data.recommenderVkLink || '',
          tenantEmail: data.tenantEmail,
          tenantName: data.tenantName,
          tenantPhoto: data.tenantPhoto || '',
          tenantVkLink: data.tenantVkLink || '',
        }),
      });
      const result = await res.json();
      const chat = parseChat(result.chat);
      if (!result.existing) {
        this.chatsCache.unshift(chat);
      } else {
        const idx = this.chatsCache.findIndex(c => c.id === chat.id);
        if (idx >= 0) this.chatsCache[idx] = chat;
        else this.chatsCache.unshift(chat);
      }
      this.notifyListeners();
      return chat;
    } catch (e) {
      console.error('createChat error:', e);
      const fallbackChat: Chat = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date(),
        unreadCount: 0,
      };
      this.chatsCache.unshift(fallbackChat);
      this.notifyListeners();
      return fallbackChat;
    }
  }

  async fetchMessages(chatId: string, afterId?: string): Promise<Message[]> {
    try {
      const safeAfterId = afterId && !afterId.startsWith('temp_') ? afterId : undefined;
      let url = `${API_URL}?action=messages&chat_id=${chatId}`;
      if (safeAfterId) url += `&after_id=${safeAfterId}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) return this.messagesCache.get(chatId) || [];
      const data = await res.json();
      const messages = (data.messages || []).map(parseMessage);

      if (safeAfterId) {
        const existing = this.messagesCache.get(chatId) || [];
        const existingIds = new Set(existing.map(m => m.id));
        const newMsgs = messages.filter((m: Message) => !existingIds.has(m.id));
        if (newMsgs.length > 0) {
          const merged = [...existing, ...newMsgs].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          );
          this.messagesCache.set(chatId, merged);
          this.notifyListeners();
        }
      } else {
        this.messagesCache.set(chatId, messages);
        this.notifyListeners();
      }

      return this.messagesCache.get(chatId) || [];
    } catch (e) {
      console.error('fetchMessages error:', e);
      return this.messagesCache.get(chatId) || [];
    }
  }

  getMessages(chatId: string): Message[] {
    return (this.messagesCache.get(chatId) || []).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  async sendMessage(data: Omit<Message, 'id' | 'createdAt' | 'read'>): Promise<Message> {
    const hasPhotos = data.photos && data.photos.length > 0;
    const optimisticMsg: Message = {
      ...data,
      id: `temp_${Date.now()}`,
      photos: hasPhotos ? data.photos : undefined,
      createdAt: new Date(),
      read: false,
      isSystemMessage: data.isSystemMessage || false,
    };

    const existing = this.messagesCache.get(data.chatId) || [];
    this.messagesCache.set(data.chatId, [...existing, optimisticMsg]);

    const chatIdx = this.chatsCache.findIndex(c => c.id === data.chatId);
    if (chatIdx >= 0) {
      this.chatsCache[chatIdx] = {
        ...this.chatsCache[chatIdx],
        lastMessage: data.text || (hasPhotos ? 'Фото' : ''),
        lastMessageTime: optimisticMsg.createdAt,
      };
    }
    this.notifyListeners();

    const res = await fetch(`${API_URL}?action=send`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        chatId: data.chatId,
        senderId: data.senderId,
        senderName: data.senderName,
        senderPhoto: data.senderPhoto || '',
        text: data.text || '',
        photos: data.photos || [],
        isSystemMessage: data.isSystemMessage || false,
      }),
    });

    if (!res.ok) {
      const msgs = this.messagesCache.get(data.chatId) || [];
      this.messagesCache.set(data.chatId, msgs.filter(m => m.id !== optimisticMsg.id));
      this.notifyListeners();
      throw new Error(`Ошибка отправки: ${res.status}`);
    }

    const result = await res.json();
    const serverMsg = parseMessage(result.message);

    const msgs = this.messagesCache.get(data.chatId) || [];
    const idx = msgs.findIndex(m => m.id === optimisticMsg.id);
    if (idx >= 0) {
      msgs[idx] = serverMsg;
    } else {
      msgs.push(serverMsg);
    }
    this.messagesCache.set(data.chatId, msgs);
    this.notifyListeners();
    return serverMsg;
  }

  async markChatAsRead(chatId: string, userEmail: string): Promise<void> {
    const chatIdx = this.chatsCache.findIndex(c => c.id === chatId);
    if (chatIdx >= 0) {
      this.chatsCache[chatIdx] = { ...this.chatsCache[chatIdx], unreadCount: 0 };
    }
    const msgs = this.messagesCache.get(chatId);
    if (msgs) {
      msgs.forEach(m => {
        if (!m.read && m.senderId !== userEmail) m.read = true;
      });
    }
    this.notifyListeners();

    try {
      await fetch(`${API_URL}?action=mark_read`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ chatId, userEmail }),
      });
    } catch (e) {
      console.error('markChatAsRead error:', e);
    }
  }

  getTotalUnreadCount(userEmail: string): number {
    return this.chatsCache
      .filter(c => c.recommenderEmail === userEmail || c.tenantEmail === userEmail)
      .reduce((total, chat) => total + (chat.unreadCount || 0), 0);
  }

  async deleteChat(chatId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_URL}?action=delete_chat`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ chatId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Ошибка удаления' };
      }
      this.chatsCache = this.chatsCache.filter(c => c.id !== chatId);
      this.messagesCache.delete(chatId);
      this.notifyListeners();
      return { success: true };
    } catch (e) {
      console.error('deleteChat error:', e);
      return { success: false, error: 'Ошибка сети' };
    }
  }

  async fetchUnreadCount(): Promise<number> {
    try {
      const res = await fetch(`${API_URL}?action=unread_count`, { headers: authHeaders() });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.unreadCount || 0;
    } catch {
      return 0;
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  sendSystemMessage(chatId: string, text: string): Promise<Message> {
    return this.sendMessage({
      chatId,
      senderId: 'system',
      senderName: 'Система',
      text,
      isSystemMessage: true,
    });
  }

  setTyping(chatId: string, userEmail: string, userName: string): void {
    this.typing.setTyping(chatId, userEmail, userName);
  }

  clearTyping(chatId: string, userEmail: string): void {
    this.typing.clearTyping(chatId, userEmail);
  }

  getTypingUsers(chatId: string, excludeUserEmail: string): string[] {
    return this.typing.getTypingUsers(chatId, excludeUserEmail);
  }

  cleanupOldTypingStatuses(): void {
    this.typing.cleanup();
  }

  isLoading(): boolean {
    return this.loading;
  }
}

export const messagesStore = new MessagesStore();