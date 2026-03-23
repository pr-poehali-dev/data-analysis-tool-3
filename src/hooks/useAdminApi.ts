import { adminStore } from "@/store/adminStore";

const ADMIN_API_URL = "https://functions.poehali.dev/fdf4da58-d05b-4439-b49f-b49f4acba9f7";

async function adminFetch(action: string, options?: RequestInit): Promise<Response> {
  const token = adminStore.getToken() || "";
  return fetch(`${ADMIN_API_URL}?action=${action}`, {
    method: "GET",
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": token,
      ...(options?.headers || {}),
    },
  });
}

async function adminPost(action: string, body: object): Promise<Response> {
  const token = adminStore.getToken() || "";
  return fetch(`${ADMIN_API_URL}?action=${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": token,
    },
    body: JSON.stringify(body),
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

export interface AdminUser {
  id: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  display_name: string;
  phone: string | null;
  city: string | null;
  role: string;
  avatar_url: string | null;
  is_blocked: boolean;
  blocked_at: string | null;
  blocked_reason: string | null;
  created_at: string | null;
  last_login_at: string | null;
  requests_count: number;
  recommendations_count: number;
}

export interface AdminUserDetail extends AdminUser {
  telegram_username: string | null;
  vk_link: string | null;
  email_verified: boolean;
  reviews_count: number;
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UsersFilter {
  search?: string;
  role?: string;
  status?: "all" | "active" | "blocked";
  page?: number;
  limit?: number;
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

  async getUsers(filter: UsersFilter = {}): Promise<UsersResponse> {
    const params = new URLSearchParams();
    params.set("action", "users");
    if (filter.search) params.set("search", filter.search);
    if (filter.role) params.set("role", filter.role);
    if (filter.status) params.set("status", filter.status);
    if (filter.page) params.set("page", String(filter.page));
    if (filter.limit) params.set("limit", String(filter.limit));

    const token = adminStore.getToken() || "";
    const res = await fetch(`${ADMIN_API_URL}?${params.toString()}`, {
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    });
    if (!res.ok) throw new Error("Ошибка загрузки пользователей");
    return res.json();
  },

  async getUser(id: number): Promise<AdminUserDetail> {
    const token = adminStore.getToken() || "";
    const res = await fetch(`${ADMIN_API_URL}?action=user&id=${id}`, {
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    });
    if (!res.ok) throw new Error("Ошибка загрузки пользователя");
    const data = await res.json();
    return data.user;
  },

  async blockUser(userId: number, block: boolean, reason?: string): Promise<void> {
    const res = await adminPost("block_user", { user_id: userId, block, reason: reason || "" });
    if (!res.ok) throw new Error("Ошибка при изменении статуса пользователя");
  },
};
