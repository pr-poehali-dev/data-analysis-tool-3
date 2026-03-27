const ADMIN_API_URL = "https://functions.poehali.dev/fdf4da58-d05b-4439-b49f-b49f4acba9f7";

async function adminFetch(action: string, options?: RequestInit): Promise<Response> {
  return fetch(`${ADMIN_API_URL}?action=${action}`, {
    method: "GET",
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
}

async function adminPost(action: string, body: object): Promise<Response> {
  return fetch(`${ADMIN_API_URL}?action=${action}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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

export interface AdminRequest {
  id: number;
  name: string;
  user_id: number | null;
  user_email: string;
  city: string | null;
  budget_min: string | null;
  budget_max: string | null;
  budget: string | null;
  housing_type: string | null;
  rooms_count: string | null;
  rental_period: string | null;
  move_in_date: string | null;
  reward: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  who_will_live: string | null;
  has_pets: string | null;
  author_name: string | null;
  offers_count: number;
}

export interface AdminRequestDetail extends AdminRequest {
  location: string | null;
  bonus: string | null;
  about_yourself: string | null;
  districts: string[];
  author_phone: string | null;
  author_avatar: string | null;
}

export interface RequestsResponse {
  requests: AdminRequest[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface RequestsFilter {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AdminRecommendation {
  id: number;
  address: string | null;
  rooms: string | null;
  rent: string | null;
  status: string;
  request_id: string | null;
  request_name: string | null;
  owner_email: string;
  created_at: string | null;
  updated_at: string | null;
  has_furniture: boolean;
  has_appliances: boolean;
  area: string | null;
  floor: string | null;
  total_floors: string | null;
  author_name: string | null;
  author_user_id: number | null;
}

export interface AdminRecommendationDetail extends AdminRecommendation {
  invite_message: string | null;
  property_comments: string | null;
  photos: string[];
  coordinates_lat: number | null;
  coordinates_lng: number | null;
  author_email: string | null;
  author_phone: string | null;
}

export interface RecommendationsResponse {
  recommendations: AdminRecommendation[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface RecommendationsFilter {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AdminEscrow {
  id: number;
  request_name: string;
  status: string;
  tenant_name: string;
  tenant_email: string;
  recommender_name: string;
  recommender_email: string;
  rent_amount: number;
  commission_amount: number;
  created_at: string | null;
  completed_at: string | null;
  chat_id: string | null;
  recommendation_id: string | null;
}

export interface AdminEscrowDetail extends AdminEscrow {
  history: { status: string; label: string; date: string | null }[];
}

export interface EscrowSummary {
  frozen_amount: number;
  completed_amount: number;
  total_amount: number;
}

export interface EscrowResponse {
  transactions: AdminEscrow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  summary: EscrowSummary;
}

export interface EscrowFilter {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AdminReview {
  id: number;
  reviewer_name: string;
  reviewer_email: string;
  reviewer_photo: string | null;
  reviewee_name: string;
  reviewee_email: string;
  reviewee_photo: string | null;
  rating: number;
  comment: string | null;
  created_at: string | null;
  chat_id: string | null;
  recommendation_id: string | null;
}

export interface ReviewsResponse {
  reviews: AdminReview[];
  total: number;
  avg_rating: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ReviewsFilter {
  search?: string;
  rating?: string;
  page?: number;
  limit?: number;
}

export interface FeedbackMessage {
  id: number;
  email: string;
  subject_type: string;
  message: string;
  status: "new" | "read" | "replied";
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string | null;
}

export interface FeedbackResponse {
  messages: FeedbackMessage[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FeedbackFilter {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AnalyticsData {
  cities: { city: string; count: number }[];
  conversion: {
    total_requests: number;
    total_recommendations: number;
    total_escrow: number;
    req_to_rec_pct: number;
    rec_to_deal_pct: number;
    req_to_deal_pct: number;
  };
  averages: {
    avg_budget: number;
    avg_rent: number;
    avg_commission: number;
  };
  housing_types: { type: string; count: number }[];
  rental_periods: { period: string; count: number }[];
  monthly_dynamics: { month: string; requests: number; users: number }[];
  user_roles: { role: string; count: number }[];
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

  async getRequests(filter: RequestsFilter = {}): Promise<RequestsResponse> {
    const params = new URLSearchParams();
    params.set("action", "requests");
    if (filter.search) params.set("search", filter.search);
    if (filter.status) params.set("status", filter.status);
    if (filter.page) params.set("page", String(filter.page));
    if (filter.limit) params.set("limit", String(filter.limit));
    const token = adminStore.getToken() || "";
    const res = await fetch(`${ADMIN_API_URL}?${params.toString()}`, {
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    });
    if (!res.ok) throw new Error("Ошибка загрузки заявок");
    return res.json();
  },

  async getRequest(id: number): Promise<AdminRequestDetail> {
    const token = adminStore.getToken() || "";
    const res = await fetch(`${ADMIN_API_URL}?action=request&id=${id}`, {
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    });
    if (!res.ok) throw new Error("Ошибка загрузки заявки");
    const data = await res.json();
    return data.request;
  },

  async updateRequestStatus(requestId: number, status: string): Promise<void> {
    const res = await adminPost("update_request_status", { request_id: requestId, status });
    if (!res.ok) throw new Error("Ошибка при изменении статуса заявки");
  },

  async deleteRequest(requestId: number): Promise<void> {
    const res = await adminPost("delete_request", { request_id: requestId });
    if (!res.ok) throw new Error("Ошибка при удалении заявки");
  },

  async getRecommendations(filter: RecommendationsFilter = {}): Promise<RecommendationsResponse> {
    const params = new URLSearchParams();
    params.set("action", "recommendations");
    if (filter.search) params.set("search", filter.search);
    if (filter.status) params.set("status", filter.status);
    if (filter.page) params.set("page", String(filter.page));
    if (filter.limit) params.set("limit", String(filter.limit));
    const token = adminStore.getToken() || "";
    const res = await fetch(`${ADMIN_API_URL}?${params.toString()}`, {
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    });
    if (!res.ok) throw new Error("Ошибка загрузки рекомендаций");
    return res.json();
  },

  async getRecommendation(id: number): Promise<AdminRecommendationDetail> {
    const token = adminStore.getToken() || "";
    const res = await fetch(`${ADMIN_API_URL}?action=recommendation&id=${id}`, {
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    });
    if (!res.ok) throw new Error("Ошибка загрузки рекомендации");
    const data = await res.json();
    return data.recommendation;
  },

  async updateRecStatus(recommendationId: number, status: string): Promise<void> {
    const res = await adminPost("update_rec_status", { recommendation_id: recommendationId, status });
    if (!res.ok) throw new Error("Ошибка при изменении статуса рекомендации");
  },

  async deleteRecommendation(recommendationId: number): Promise<void> {
    const res = await adminPost("delete_recommendation", { recommendation_id: recommendationId });
    if (!res.ok) throw new Error("Ошибка при удалении рекомендации");
  },

  async getEscrow(filter: EscrowFilter = {}): Promise<EscrowResponse> {
    const params = new URLSearchParams();
    params.set("action", "escrow");
    if (filter.search) params.set("search", filter.search);
    if (filter.status) params.set("status", filter.status);
    if (filter.page) params.set("page", String(filter.page));
    if (filter.limit) params.set("limit", String(filter.limit));
    const token = adminStore.getToken() || "";
    const res = await fetch(`${ADMIN_API_URL}?${params.toString()}`, {
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    });
    if (!res.ok) throw new Error("Ошибка загрузки сделок");
    return res.json();
  },

  async getEscrowDetail(id: number): Promise<AdminEscrowDetail> {
    const token = adminStore.getToken() || "";
    const res = await fetch(`${ADMIN_API_URL}?action=escrow_detail&id=${id}`, {
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    });
    if (!res.ok) throw new Error("Ошибка загрузки сделки");
    const data = await res.json();
    return data.transaction;
  },

  async updateEscrowStatus(escrowId: number, status: string): Promise<void> {
    const res = await adminPost("update_escrow_status", { escrow_id: escrowId, status });
    if (!res.ok) throw new Error("Ошибка при изменении статуса сделки");
  },

  async getReviews(filter: ReviewsFilter = {}): Promise<ReviewsResponse> {
    const params = new URLSearchParams();
    params.set("action", "reviews");
    if (filter.search) params.set("search", filter.search);
    if (filter.rating) params.set("rating", filter.rating);
    if (filter.page) params.set("page", String(filter.page));
    if (filter.limit) params.set("limit", String(filter.limit));
    const token = adminStore.getToken() || "";
    const res = await fetch(`${ADMIN_API_URL}?${params.toString()}`, {
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    });
    if (!res.ok) throw new Error("Ошибка загрузки отзывов");
    return res.json();
  },

  async deleteReview(reviewId: number): Promise<void> {
    const res = await adminPost("delete_review", { review_id: reviewId });
    if (!res.ok) throw new Error("Ошибка при удалении отзыва");
  },

  async getFeedback(filter: FeedbackFilter = {}): Promise<FeedbackResponse> {
    const params = new URLSearchParams();
    params.set("action", "feedback");
    if (filter.search) params.set("search", filter.search);
    if (filter.status) params.set("status", filter.status);
    if (filter.page) params.set("page", String(filter.page));
    if (filter.limit) params.set("limit", String(filter.limit));
    const token = adminStore.getToken() || "";
    const res = await fetch(`${ADMIN_API_URL}?${params.toString()}`, {
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    });
    if (!res.ok) throw new Error("Ошибка загрузки обратной связи");
    return res.json();
  },

  async markFeedbackRead(feedbackId: number): Promise<void> {
    const res = await adminPost("mark_feedback_read", { feedback_id: feedbackId });
    if (!res.ok) throw new Error("Ошибка при изменении статуса обращения");
  },

  async replyFeedback(feedbackId: number, reply: string): Promise<void> {
    const res = await adminPost("reply_feedback", { feedback_id: feedbackId, reply });
    if (!res.ok) throw new Error("Ошибка при отправке ответа");
  },

  async getAnalytics(): Promise<AnalyticsData> {
    const res = await adminFetch("analytics");
    if (!res.ok) throw new Error("Ошибка загрузки аналитики");
    return res.json();
  },
};