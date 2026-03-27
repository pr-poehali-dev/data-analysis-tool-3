// Хранилище сессии администратора (sessionStorage — закрывается вместе с вкладкой)
const TOKEN_KEY = "admin_token";

export const adminStore = {
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
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
