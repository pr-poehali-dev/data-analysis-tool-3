type User = {
  firstName: string;
  lastName: string;
  role: "tenant" | "recommender" | "landlord";
  email: string;
  phone: string;
  city?: string;
} | null;

let currentUser: User = null;
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

  isAuthenticated: (): boolean => {
    return authStore.getUser() !== null;
  },

  isRecommender: (): boolean => {
    const user = authStore.getUser();
    return user?.role === "recommender";
  },

  logout: () => {
    authStore.setUser(null);
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
