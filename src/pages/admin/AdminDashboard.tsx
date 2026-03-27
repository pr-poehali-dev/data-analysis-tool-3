import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { adminApi, DashboardStats, RegistrationDay, ActivityItem } from "@/hooks/useAdminApi";
import Icon from "@/components/ui/icon";

const ACTIVITY_ICONS: Record<string, string> = {
  user: "UserPlus",
  request: "FileText",
  recommendation: "ThumbsUp",
};

const ACTIVITY_COLORS: Record<string, string> = {
  user: "bg-blue-100 text-blue-600",
  request: "bg-green-100 text-green-600",
  recommendation: "bg-purple-100 text-purple-600",
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationDay[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [statsData, regsData, activityData] = await Promise.all([
          adminApi.getStats(),
          adminApi.getRegistrations(),
          adminApi.getActivity(),
        ]);
        setStats(statsData);
        setRegistrations(regsData.map((r) => ({ ...r, day: formatDate(r.day) })));
        setActivity(activityData);
      } catch {
        setError("Не удалось загрузить данные. Попробуйте обновить страницу.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const STAT_CARDS = stats
    ? [
        { label: "Пользователи", value: stats.users_total, sub: `+${stats.new_users_30d} за 30 дней`, icon: "Users", color: "text-blue-600 bg-blue-50" },
        { label: "Заявки", value: stats.requests_total, sub: `+${stats.new_requests_30d} за 30 дней`, icon: "FileText", color: "text-green-600 bg-green-50" },
        { label: "Рекомендации", value: stats.recommendations_total, sub: "всего", icon: "ThumbsUp", color: "text-purple-600 bg-purple-50" },
        { label: "Сделки", value: stats.escrow_total, sub: "всего", icon: "Banknote", color: "text-orange-600 bg-orange-50" },
        { label: "Отзывы", value: stats.reviews_total, sub: "всего", icon: "Star", color: "text-yellow-600 bg-yellow-50" },
      ]
    : [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Дашборд</h1>
        <p className="text-muted-foreground mt-1">Общая статистика платформы</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700 text-sm">
          <Icon name="AlertCircle" size={16} />
          {error}
        </div>
      )}

      {/* Счётчики */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-background border rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STAT_CARDS.map((card) => (
            <div key={card.label} className="bg-background border rounded-xl p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.color}`}>
                <Icon name={card.icon} size={20} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold text-foreground leading-tight">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* График регистраций */}
      <div className="bg-background border rounded-xl p-4 md:p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Регистрации за последние 30 дней</h2>
        {loading ? (
          <div className="h-52 animate-pulse bg-muted rounded-lg" />
        ) : registrations.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
            Нет данных за последние 30 дней
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={registrations} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={32} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                labelFormatter={(v) => `Дата: ${v}`}
                formatter={(v: number) => [`${v} чел.`, "Регистрации"]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#regGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Лента последних действий */}
      <div className="bg-background border rounded-xl p-4 md:p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Последние действия</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-muted-foreground text-sm">Действий пока нет</p>
        ) : (
          <div className="space-y-2">
            {activity.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 py-2 border-b last:border-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ACTIVITY_COLORS[item.type] || "bg-gray-100 text-gray-600"}`}>
                  <Icon name={ACTIVITY_ICONS[item.type] || "Activity"} size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.action}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}