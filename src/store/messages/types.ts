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

export interface TypingStatus {
  chatId: string;
  userEmail: string;
  userName: string;
  timestamp: number;
}

export function parseChat(c: Record<string, unknown>): Chat {
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

export function parseMessage(m: Record<string, unknown>): Message {
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
