import funcUrls from "../../backend/func2url.json";

const API_URL = (funcUrls as Record<string, string>)["messages-api"];

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  photos?: string[];
  createdAt: Date;
  read: boolean;
  isSystemMessage?: boolean;
}

export interface Chat {
  id: string;
  recommendationId: string;
  requestId: string;
  requestName: string;
  recommenderEmail: string;
  recommenderName: string;
  recommenderPhoto?: string;
  recommenderVkLink?: string;
  tenantEmail: string;
  tenantName: string;
  tenantPhoto?: string;
  tenantVkLink?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  createdAt: Date;
}

interface TypingStatus {
  chatId: string;
  userEmail: string;
  userName: string;
  timestamp: number;
}

const TYPING_STORAGE_KEY = 'sovietpay_typing';

function parseChat(c: Record<string, unknown>): Chat {
  return {
    ...c,
    id: String(c.id || ''),
    recommendationId: String(c.recommendationId || ''),
    requestId: String(c.requestId || ''),
    requestName: String(c.requestName || ''),
    recommenderEmail: String(c.recommenderEmail || ''),
    recommenderName: String(c.recommenderName || ''),
    recommenderPhoto: c.recommenderPhoto as string | undefined,
    recommenderVkLink: c.recommenderVkLink as string | undefined,
    tenantEmail: String(c.tenantEmail || ''),
    tenantName: String(c.tenantName || ''),
    tenantPhoto: c.tenantPhoto as string | undefined,
    tenantVkLink: c.tenantVkLink as string | undefined,
    lastMessage: c.lastMessage as string | undefined,
    lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime as string) : undefined,
    unreadCount: Number(c.unreadCount || 0),
    createdAt: new Date(c.createdAt as string),
  } as Chat;
}

function parseMessage(m: Record<string, unknown>): Message {
  return {
    id: String(m.id || ''),
    chatId: String(m.chatId || ''),
    senderId: String(m.senderId || ''),
    senderName: String(m.senderName || ''),
    senderPhoto: m.senderPhoto as string | undefined,
    text: String(m.text || ''),
    photos: (m.photos as string[]) || [],
    createdAt: new Date(m.createdAt as string),
    read: Boolean(m.read),
    isSystemMessage: Boolean(m.isSystemMessage),
  };
}

class MessagesStore {
  private listeners: Set<() => void> = new Set();
  private chatsCache: Chat[] = [];
  private messagesCache: Map<string, Message[]> = new Map();
  private loading = false;

  async fetchUserChats(userEmail: string): Promise<Chat[]> {
    try {
      const res = await fetch(`${API_URL}?user_email=${encodeURIComponent(userEmail)}`);
      if (!res.ok) return this.chatsCache;
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
      const res = await fetch(`${API_URL}?action=chat_by_recommendation&recommendation_id=${encodeURIComponent(recommendationId)}`);
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
        headers: { 'Content-Type': 'application/json' },
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
      let url = `${API_URL}?action=messages&chat_id=${chatId}`;
      if (afterId) url += `&after_id=${afterId}`;
      const res = await fetch(url);
      if (!res.ok) return this.messagesCache.get(chatId) || [];
      const data = await res.json();
      const messages = (data.messages || []).map(parseMessage);

      if (afterId) {
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
    const optimisticMsg: Message = {
      ...data,
      id: `temp_${Date.now()}`,
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
        lastMessage: data.text || 'Фото',
        lastMessageTime: optimisticMsg.createdAt,
      };
    }
    this.notifyListeners();

    try {
      const res = await fetch(`${API_URL}?action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } catch (e) {
      console.error('sendMessage error:', e);
      return optimisticMsg;
    }
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
        headers: { 'Content-Type': 'application/json' },
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

  async fetchUnreadCount(userEmail: string): Promise<number> {
    try {
      const res = await fetch(`${API_URL}?action=unread_count&user_email=${encodeURIComponent(userEmail)}`);
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
    if (typeof window === 'undefined') return;
    const typingStatuses = this.getTypingStatuses();
    const existingIndex = typingStatuses.findIndex(
      t => t.chatId === chatId && t.userEmail === userEmail
    );
    const newStatus: TypingStatus = { chatId, userEmail, userName, timestamp: Date.now() };
    if (existingIndex !== -1) {
      typingStatuses[existingIndex] = newStatus;
    } else {
      typingStatuses.push(newStatus);
    }
    localStorage.setItem(TYPING_STORAGE_KEY, JSON.stringify(typingStatuses));
    this.notifyListeners();
  }

  clearTyping(chatId: string, userEmail: string): void {
    if (typeof window === 'undefined') return;
    const typingStatuses = this.getTypingStatuses();
    const filtered = typingStatuses.filter(
      t => !(t.chatId === chatId && t.userEmail === userEmail)
    );
    localStorage.setItem(TYPING_STORAGE_KEY, JSON.stringify(filtered));
    this.notifyListeners();
  }

  getTypingUsers(chatId: string, excludeUserEmail: string): string[] {
    const now = Date.now();
    return this.getTypingStatuses()
      .filter(t => t.chatId === chatId && t.userEmail !== excludeUserEmail && (now - t.timestamp) < 5000)
      .map(t => t.userName);
  }

  private getTypingStatuses(): TypingStatus[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(TYPING_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  }

  cleanupOldTypingStatuses(): void {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    const filtered = this.getTypingStatuses().filter(t => (now - t.timestamp) < 10000);
    localStorage.setItem(TYPING_STORAGE_KEY, JSON.stringify(filtered));
  }

  isLoading(): boolean {
    return this.loading;
  }
}

export const messagesStore = new MessagesStore();
