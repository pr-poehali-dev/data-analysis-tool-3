const ADMIN_AUTH_URL = "https://functions.poehali.dev/f95fb7eb-1686-4a09-83f0-31116870baa3";

export const adminStore = {
  async verifySession(): Promise<boolean> {
    try {
      const res = await fetch(`${ADMIN_AUTH_URL}/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.valid === true;
    } catch (e) {
      return false;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${ADMIN_AUTH_URL}/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Logout error", e);
    }
  },

  // Stub-методы для обратной совместимости — токен больше не хранится в JS
  getToken(): string | null {
    return null;
  },

  setToken(_token: string): void {
    // токен хранится в httpOnly cookie, не в JS
  },

  clearToken(): void {
    // очистка через logout()
  },

  isAuthenticated(): boolean {
    return false;
  },
};
