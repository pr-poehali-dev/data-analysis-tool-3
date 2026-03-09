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
const REFRESH_TOKEN_KEY = "sovetpay_refresh_token";
const REFRESH_COOKIE_NAME = "app_rt";

const LEGACY_REFRESH_KEYS = [
  "auth_refresh_token",
  "google_auth_refresh_token",
  "vk_auth_refresh_token",
  "yandex_auth_refresh_token",
  "telegram_auth_refresh_token",
  "refresh_token",
  "sovetpay_token",
  "google_auth_access_token",
  "vk_auth_access_token",
  "yandex_auth_access_token",
  "telegram_auth_access_token",
  "email_auth_access_token",
];

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
  if (saved && saved in REFRESH_URLS) return saved as AuthProvider;
  return null;
}

function cleanupLegacyTokens(): void {
  LEGACY_REFRESH_KEYS.forEach((key) => localStorage.removeItem(key));
}

function setCookie(name: string, value: string, days: number): void {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=strict`;
}

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

function saveRefreshToken(token: string): void {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    cleanupLegacyTokens();
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {
      console.warn("[auth] localStorage full, could not save refresh_token to localStorage");
    }
  }
  setCookie(REFRESH_COOKIE_NAME, token, 30);
}

function readRefreshToken(): string {
  const fromStorage = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (fromStorage) return fromStorage;

  const fromCookie = getCookie(REFRESH_COOKIE_NAME);
  if (fromCookie) {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, fromCookie);
    } catch {
      // ignore
    }
    return fromCookie;
  }
  return "";
}

function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  deleteCookie(REFRESH_COOKIE_NAME);
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    cleanupLegacyTokens();
    try {
      localStorage.setItem(key, value);
    } catch {
      console.warn("[auth] localStorage quota exceeded, clearing non-essential keys");
      const keysToKeep = [PROVIDER_KEY, USER_KEY, REFRESH_TOKEN_KEY];
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && !keysToKeep.includes(k)) allKeys.push(k);
      }
      allKeys.forEach((k) => localStorage.removeItem(k));
      try {
        localStorage.setItem(key, value);
      } catch {
        console.error("[auth] localStorage still full after cleanup");
      }
    }
  }
}

async function doRefresh(): Promise<string> {
  const provider = getProvider();
  if (!provider) return "no_provider";

  const url = REFRESH_URLS[provider];
  if (!url) return "no_url";

  const savedRefreshToken = readRefreshToken();
  console.log("[doRefresh] provider:", provider, "has_token:", !!savedRefreshToken, "token_len:", savedRefreshToken.length);

  if (!savedRefreshToken) {
    return "no_token";
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refresh_token: savedRefreshToken }),
    });

    console.log("[doRefresh] response status:", res.status);

    if (res.status === 401) return "expired";
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.log("[doRefresh] error response:", errData);
      return "error";
    }

    const data = await res.json();
    currentAccessToken = data.access_token;
    if (data.refresh_token) {
      saveRefreshToken(data.refresh_token);
      console.log("[doRefresh] new refresh_token saved");
    }
    return "ok";
  } catch (e) {
    console.error("[doRefresh] network error:", e);
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
      safeSetItem(USER_KEY, JSON.stringify(user));
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

  setRefreshToken: (token: string | null) => {
    if (token) {
      saveRefreshToken(token);
    } else {
      clearRefreshToken();
    }
  },

  getAuthHeaders: (): Record<string, string> => {
    const token = currentAccessToken;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  },

  setProvider: (provider: AuthProvider) => {
    if (provider) {
      safeSetItem(PROVIDER_KEY, provider);
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

    const LOGOUT_URLS: Record<string, string> = {
      email: `${funcUrls["auth-email-auth"]}?action=logout`,
      google: `${funcUrls["google-auth-google-auth"]}?action=logout`,
      vk: `${funcUrls["vk-auth-vk-auth"]}?action=logout`,
      yandex: `${funcUrls["yandex-auth-yandex-auth"]}?action=logout`,
      telegram: `${funcUrls["telegram-bot-telegram-auth"]}?action=logout`,
    };

    const savedRefreshToken = readRefreshToken();

    if (provider && LOGOUT_URLS[provider]) {
      fetch(LOGOUT_URLS[provider], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ refresh_token: savedRefreshToken }),
      }).catch(() => {});
    }

    currentAccessToken = null;
    cleanupLegacyTokens();
    localStorage.removeItem(PROVIDER_KEY);
    clearRefreshToken();
    authStore.setUser(null);
  },

  handleUnauthorized: (response: Response): boolean => {
    if (response.status === 401 && currentAccessToken) {
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
      cleanupLegacyTokens();

      const hasUser = !!localStorage.getItem(USER_KEY);
      const provider = getProvider();

      if (!hasUser && !provider) {
        sessionRestored = true;
        return;
      }

      const result = await doRefresh();
      console.log("[restoreSession] refresh result:", result);

      if (result === "expired") {
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
