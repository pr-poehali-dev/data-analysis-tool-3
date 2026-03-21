import { adminStore } from "@/store/adminStore";

// URL обновляется после деплоя бэкенда
const ADMIN_API_URL = "https://functions.poehali.dev/fdf4da58-d05b-4439-b49f-b49f4acba9f7";

async function adminFetch(action: string): Promise<Response> {
  const token = adminStore.getToken() || "";
  return fetch(`${ADMIN_API_URL}?action=${action}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": token,
    },
  });
}

export interface DashboardStats {
  users_total: number;
  requests_total: number;
  recommendations_total: number;
  escrow_total: number;
  reviews_total: number;
  new_users_30d: number;
  new_requests_30d: number;
}

export interface RegistrationDay {
  day: string;
  count: number;
}

export interface ActivityItem {
  type: "user" | "request" | "recommendation";
  id: number;
  title: string;
  action: string;
  created_at: string;
}

export const adminApi = {
  async getStats(): Promise<DashboardStats> {
    const res = await adminFetch("stats");
    if (!res.ok) throw new Error("Ошибка загрузки статистики");
    return res.json();
  },

  async getRegistrations(): Promise<RegistrationDay[]> {
    const res = await adminFetch("registrations");
    if (!res.ok) throw new Error("Ошибка загрузки графика");
    const data = await res.json();
    return data.registrations;
  },

  async getActivity(): Promise<ActivityItem[]> {
    const res = await adminFetch("activity");
    if (!res.ok) throw new Error("Ошибка загрузки активности");
    const data = await res.json();
    return data.activity;
  },
};