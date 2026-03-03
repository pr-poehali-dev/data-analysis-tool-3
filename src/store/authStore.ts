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

let currentUser: User = null;
let currentAccessToken: string | null = localStorage.getItem("sovetpay_token");
const listeners: (() => void)[] = [];

export const authStore = {
  getUser: (): User => {
    if (!currentUser) {
      const saved = localStorage.getItem("sovetpay_user");
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
      localStorage.setItem("sovetpay_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("sovetpay_user");
    }
    listeners.forEach((listener) => listener());
  },

  getAccessToken: (): string | null => {
    return currentAccessToken;
  },

  setAccessToken: (token: string | null) => {
    currentAccessToken = token;
    if (token) {
      localStorage.setItem("sovetpay_token", token);
    } else {
      localStorage.removeItem("sovetpay_token");
    }
  },

  getAuthHeaders: (): Record<string, string> => {
    const token = currentAccessToken;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  },

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
    currentAccessToken = null;
    localStorage.removeItem("sovetpay_token");
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
