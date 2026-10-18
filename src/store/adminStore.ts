// Хранилище сессии администратора (sessionStorage — закрывается вместе с вкладкой)
const TOKEN_KEY = "admin_token";
const EXPIRED_KEY = "admin_session_expired";

export const adminStore = {
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    sessionStorage.removeItem(EXPIRED_KEY);
    sessionStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  },

  markSessionExpired(): void {
    sessionStorage.setItem(EXPIRED_KEY, "1");
  },

  isSessionExpired(): boolean {
    return sessionStorage.getItem(EXPIRED_KEY) === "1";
  },

  clearSessionExpired(): void {
    sessionStorage.removeItem(EXPIRED_KEY);
  },

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem(TOKEN_KEY);
  },

  async verifySession(): Promise<boolean> {
    return this.isAuthenticated();
  },

  async logout(): Promise<void> {
    this.clearToken();
  },
};
