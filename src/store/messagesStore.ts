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
}

export interface Chat {
  id: string;
  recommendationId: string;
  requestId: string;
  requestName: string;
  recommenderEmail: string;
  recommenderName: string;
  recommenderPhoto?: string;
  tenantEmail: string;
  tenantName: string;
  tenantPhoto?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  createdAt: Date;
}

const MESSAGES_STORAGE_KEY = 'sovietpay_messages';
const CHATS_STORAGE_KEY = 'sovietpay_chats';
const TYPING_STORAGE_KEY = 'sovietpay_typing';

interface TypingStatus {
  chatId: string;
  userEmail: string;
  userName: string;
  timestamp: number;
}

class MessagesStore {
  private listeners: Set<() => void> = new Set();

  getChats(): Chat[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(CHATS_STORAGE_KEY);
    if (!stored) return [];
    const chats = JSON.parse(stored);
    return chats.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime) : undefined,
    }));
  }

  getMessages(chatId: string): Message[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!stored) return [];
    const messages = JSON.parse(stored);
    return messages
      .filter((m: any) => m.chatId === chatId)
      .map((m: any) => ({
        ...m,
        createdAt: new Date(m.createdAt),
      }))
      .sort((a: Message, b: Message) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  getUserChats(userEmail: string): Chat[] {
    const chats = this.getChats();
    return chats
      .filter(c => c.recommenderEmail === userEmail || c.tenantEmail === userEmail)
      .sort((a, b) => {
        const timeA = a.lastMessageTime?.getTime() || a.createdAt.getTime();
        const timeB = b.lastMessageTime?.getTime() || b.createdAt.getTime();
        return timeB - timeA;
      });
  }

  getChatByRecommendation(recommendationId: string): Chat | undefined {
    return this.getChats().find(c => c.recommendationId === recommendationId);
  }

  createChat(data: Omit<Chat, 'id' | 'createdAt' | 'unreadCount'>): Chat {
    const existingChat = this.getChatByRecommendation(data.recommendationId);
    if (existingChat) return existingChat;

    const newChat: Chat = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      unreadCount: 0,
    };

    const chats = this.getChats();
    chats.unshift(newChat);
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
    this.notifyListeners();

    return newChat;
  }

  sendMessage(data: Omit<Message, 'id' | 'createdAt' | 'read'>): Message {
    const newMessage: Message = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false,
    };

    const messages = this.getAllMessages();
    messages.push(newMessage);
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));

    const chats = this.getChats();
    const chatIndex = chats.findIndex(c => c.id === data.chatId);
    if (chatIndex !== -1) {
      chats[chatIndex].lastMessage = data.text;
      chats[chatIndex].lastMessageTime = newMessage.createdAt;
      chats[chatIndex].unreadCount += 1;
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
    }

    this.notifyListeners();
    return newMessage;
  }

  markChatAsRead(chatId: string, userEmail: string): void {
    const messages = this.getAllMessages();
    let updated = false;

    messages.forEach(m => {
      if (m.chatId === chatId && !m.read && m.senderId !== userEmail) {
        m.read = true;
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));

      const chats = this.getChats();
      const chatIndex = chats.findIndex(c => c.id === chatId);
      if (chatIndex !== -1) {
        chats[chatIndex].unreadCount = 0;
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
      }

      this.notifyListeners();
    }
  }

  getTotalUnreadCount(userEmail: string): number {
    const chats = this.getUserChats(userEmail);
    return chats.reduce((total, chat) => {
      const messages = this.getMessages(chat.id);
      const unread = messages.filter(m => !m.read && m.senderId !== userEmail).length;
      return total + unread;
    }, 0);
  }

  private getAllMessages(): Message[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((m: any) => ({
      ...m,
      createdAt: new Date(m.createdAt),
    }));
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  setTyping(chatId: string, userEmail: string, userName: string): void {
    if (typeof window === 'undefined') return;
    
    const typingStatuses = this.getTypingStatuses();
    const existingIndex = typingStatuses.findIndex(
      t => t.chatId === chatId && t.userEmail === userEmail
    );

    const newStatus: TypingStatus = {
      chatId,
      userEmail,
      userName,
      timestamp: Date.now(),
    };

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
    const typingStatuses = this.getTypingStatuses();
    
    return typingStatuses
      .filter(
        t => t.chatId === chatId && 
        t.userEmail !== excludeUserEmail && 
        (now - t.timestamp) < 5000
      )
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
    const typingStatuses = this.getTypingStatuses();
    const filtered = typingStatuses.filter(t => (now - t.timestamp) < 10000);
    
    localStorage.setItem(TYPING_STORAGE_KEY, JSON.stringify(filtered));
  }
}

export const messagesStore = new MessagesStore();