import funcUrls from "../../backend/func2url.json";

type User = {
  firstName: string;
  lastName: string;
  role: "tenant" | "recommender" | "landlord";
  email: string;
  phone: string;
  city?: string;
  photo?: string;
  vkLink?: string;
  telegramUsername?: string;
} | null;

type AuthProvider = "email" | "google" | "vk" | "yandex" | "telegram" | null;

const PROVIDER_KEY = "sovetpay_auth_provider";
const USER_KEY = "sovetpay_user";

const REFRESH_KEYS: Record<string, string> = {
  email: "auth_refresh_token",
  google: "google_auth_refresh_token",
  vk: "vk_auth_refresh_token",
  yandex: "yandex_auth_refresh_token",
  telegram: "telegram_auth_refresh_token",
};

const REFRESH_URLS: Record<string, string> = {
  email: `${funcUrls["auth-email-auth"]}?action=refresh`,
  google: `${funcUrls["google-auth-google-auth"]}?action=refresh`,
  vk: `${funcUrls["vk-auth-vk-auth"]}?action=refresh`,
  yandex: `${funcUrls["yandex-auth-yandex-auth"]}?action=refresh`,
  telegram: `${funcUrls["telegram-bot-telegram-auth"]}?action=refresh`,
};

let currentUser: User = null;
let currentAccessToken: string | null = null;
let sessionRestored = false;
let restorePromise: Promise<void> | null = null;
const listeners: (() => void)[] = [];

function getProvider(): AuthProvider {
  const saved = localStorage.getItem(PROVIDER_KEY);
  if (saved && saved in REFRESH_KEYS) return saved as AuthProvider;
  return null;
}

function detectProviderFromLegacyKeys(): AuthProvider {
  if (localStorage.getItem("auth_refresh_token") || localStorage.getItem("refresh_token")) return "email";
  if (localStorage.getItem("google_auth_refresh_token")) return "google";
  if (localStorage.getItem("vk_auth_refresh_token")) return "vk";
  if (localStorage.getItem("yandex_auth_refresh_token")) return "yandex";
  if (localStorage.getItem("telegram_auth_refresh_token")) return "telegram";
  return null;
}

function getRefreshToken(provider: AuthProvider): string | null {
  if (!provider) return null;
  if (provider === "email") return null;
  const key = REFRESH_KEYS[provider];
  if (!key) return null;
  return localStorage.getItem(key);
}

function getLegacyEmailRefreshToken(): string | null {
  return (
    localStorage.getItem(REFRESH_KEYS.email) ||
    localStorage.getItem("refresh_token")
  );
}

async function doRefreshEmail(): Promise<string> {
  const url = REFRESH_URLS.email;
  if (!url) return "no_url";

  const legacyToken = getLegacyEmailRefreshToken();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: legacyToken
        ? JSON.stringify({ refresh_token: legacyToken })
        : JSON.stringify({}),
    });

    if (res.status === 401) return "expired";
    if (!res.ok) return "error";

    const data = await res.json();
    currentAccessToken = data.access_token;

    if (legacyToken) {
      localStorage.removeItem(REFRESH_KEYS.email);
      localStorage.removeItem("refresh_token");
    }

    return "ok";
  } catch {
    return "network_error";
  }
}

async function doRefresh(): Promise<string> {
  let provider = getProvider();
  if (!provider) {
    provider = detectProviderFromLegacyKeys();
    if (provider) {
      localStorage.setItem(PROVIDER_KEY, provider);
    }
  }
  if (!provider) return "no_provider";

  if (provider === "email") {
    return doRefreshEmail();
  }

  const refreshToken = getRefreshToken(provider);
  if (!refreshToken) return "no_token";

  const url = REFRESH_URLS[provider];
  if (!url) return "no_url";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (res.status === 401) return "expired";
    if (!res.ok) return "error";

    const data = await res.json();
    currentAccessToken = data.access_token;
    return "ok";
  } catch {
    return "network_error";
  }
}

export const authStore = {
  getUser: (): User => {
    if (!currentUser) {
      const saved = localStorage.getItem(USER_KEY);
      if (saved) {
        try {
          currentUser = JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
    }
    return currentUser;
  },

  setUser: (user: User) => {
    currentUser = user;
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
    listeners.forEach((listener) => listener());
  },

  getAccessToken: (): string | null => {
    return currentAccessToken;
  },

  setAccessToken: (token: string | null) => {
    currentAccessToken = token;
  },

  getAuthHeaders: (): Record<string, string> => {
    const token = currentAccessToken;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  },

  setProvider: (provider: AuthProvider) => {
    if (provider) {
      localStorage.setItem(PROVIDER_KEY, provider);
    } else {
      localStorage.removeItem(PROVIDER_KEY);
    }
  },

  getProvider,

  isAuthenticated: (): boolean => {
    return authStore.getUser() !== null;
  },

  isRecommender: (): boolean => {
    const user = authStore.getUser();
    return user?.role === "recommender";
  },

  updateUser: (updates: Partial<NonNullable<User>>) => {
    const current = authStore.getUser();
    if (current) {
      const updated = { ...current, ...updates };
      authStore.setUser(updated);
    }
  },

  logout: () => {
    const provider = getProvider();

    if (provider === "email") {
      const logoutUrl = `${funcUrls["auth-email-auth"]}?action=logout`;
      fetch(logoutUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      }).catch(() => {});
    }

    currentAccessToken = null;
    if (provider) {
      const key = REFRESH_KEYS[provider];
      if (key) localStorage.removeItem(key);
    }
    localStorage.removeItem("refresh_token");
    localStorage.removeItem(PROVIDER_KEY);
    localStorage.removeItem("sovetpay_token");
    localStorage.removeItem("google_auth_access_token");
    localStorage.removeItem("vk_auth_access_token");
    localStorage.removeItem("yandex_auth_access_token");
    localStorage.removeItem("telegram_auth_access_token");
    localStorage.removeItem("email_auth_access_token");
    authStore.setUser(null);
  },

  handleUnauthorized: (response: Response): boolean => {
    if (response.status === 401) {
      authStore.logout();
      window.location.href = "/";
      return true;
    }
    return false;
  },

  restoreSession: async (): Promise<void> => {
    if (sessionRestored) return;
    if (restorePromise) return restorePromise;

    restorePromise = (async () => {
      const hasUser = !!localStorage.getItem(USER_KEY);
      const provider = getProvider();
      const hasEmailProvider = provider === "email";

      if (!hasUser && !hasEmailProvider) {
        sessionRestored = true;
        return;
      }

      const result = await doRefresh();
      if (result === "ok") {
        // ok
      } else if (result === "network_error" || result === "error") {
        // don't logout
      } else {
        authStore.logout();
      }
      sessionRestored = true;
    })();

    return restorePromise;
  },

  isSessionRestored: (): boolean => {
    return sessionRestored;
  },

  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },
};