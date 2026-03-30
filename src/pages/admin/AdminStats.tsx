import { useState, useEffect } from "react";
import { adminApi, AnalyticsData } from "@/hooks/useAdminApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Icon from "@/components/ui/icon";
import {
  formatMoney,
  ROLE_LABELS_PLURAL as ROLE_LABELS,
  PERIOD_LABELS,
  CHART_COLORS as COLORS,
} from "@/lib/admin";

function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string;
  icon: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon} size={16} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b">{children}</h2>
  );
}

function ConversionStep({
  label,
  count,
  pct,
  color,
}: {
  label: string;
  count: number;
  pct?: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-3 h-3 rounded-full ${color} shrink-0`} />
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-lg font-bold text-foreground">{count}</span>
        </div>
        {pct !== undefined && (
          <div className="mt-1">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{pct}% от предыдущего этапа</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminStats() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getAnalytics()
      .then(setData)
      .catch(() => setError("Не удалось загрузить аналитику"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        <Icon name="Loader2" size={24} className="animate-spin mr-2" />
        Загрузка аналитики...
      </div>
    );
  }

  if (error || !data) {
    return <div className="flex items-center justify-center py-32 text-destructive">{error}</div>;
  }

  const { conversion, averages, cities, housing_types, rental_periods, monthly_dynamics, user_roles } = data;

  // Месяцы — форматируем подпись
  const dynamicsFormatted = monthly_dynamics.map((d) => ({
    ...d,
    label: d.month.slice(5, 7) + "." + d.month.slice(0, 4),
  }));

  return (
    <div className="p-4 md:p-6 space-y-8 md:space-y-10 overflow-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Статистика</h1>
        <p className="text-sm text-muted-foreground mt-1">Аналитика работы платформы</p>
      </div>

      {/* ── Средние показатели ── */}
      <section>
        <SectionTitle>Средние показатели</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Средний бюджет (заявки)"
            value={averages.avg_budget > 0 ? formatMoney(averages.avg_budget) : "—"}
            icon="Wallet"
            sub="из полей budget_min / budget_max"
          />
          <StatCard
            label="Средняя аренда (сделки)"
            value={averages.avg_rent > 0 ? formatMoney(averages.avg_rent) : "—"}
            icon="Home"
            sub="по завершённым сделкам"
          />
          <StatCard
            label="Средняя комиссия (сделки)"
            value={averages.avg_commission > 0 ? formatMoney(averages.avg_commission) : "—"}
            icon="Gift"
            sub="по завершённым сделкам"
          />
        </div>
      </section>

      {/* ── Конверсия ── */}
      <section>
        <SectionTitle>Конверсия: заявка → рекомендация → сделка</SectionTitle>
        <div className="rounded-lg border bg-background p-4 md:p-6 space-y-5 max-w-lg">
          <ConversionStep
            label="Заявок"
            count={conversion.total_requests}
            color="bg-indigo-500"
          />
          <ConversionStep
            label="Рекомендаций"
            count={conversion.total_recommendations}
            pct={conversion.req_to_rec_pct}
            color="bg-emerald-500"
          />
          <ConversionStep
            label="Сделок"
            count={conversion.total_escrow}
            pct={conversion.rec_to_deal_pct}
            color="bg-amber-500"
          />
          <div className="pt-3 border-t text-sm text-muted-foreground">
            Итоговая конверсия заявка → сделка:{" "}
            <span className="font-semibold text-foreground">{conversion.req_to_deal_pct}%</span>
          </div>
        </div>
      </section>

      {/* ── Динамика по месяцам ── */}
      {dynamicsFormatted.length > 0 && (
        <section>
          <SectionTitle>Динамика за последние 12 месяцев</SectionTitle>
          <div className="rounded-lg border bg-background p-3 md:p-4">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dynamicsFormatted} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value,
                    name === "requests" ? "Заявки" : "Регистрации",
                  ]}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend
                  formatter={(value) => (value === "requests" ? "Заявки" : "Регистрации")}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── Города ── */}
      {cities.length > 0 && (
        <section>
          <SectionTitle>Заявки по городам (топ-10)</SectionTitle>
          <div className="rounded-lg border bg-background p-4 overflow-x-auto">
            <div className="min-w-[300px]">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={cities}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 70, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="city"
                  tick={{ fontSize: 10 }}
                  width={70}
                />
                <Tooltip
                  formatter={(value: number) => [value, "Заявок"]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* ── Типы жилья и Срок аренды ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {housing_types.length > 0 && (
          <section>
            <SectionTitle>Тип жилья</SectionTitle>
            <div className="rounded-lg border bg-background p-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={housing_types}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ type, percent }) =>
                      `${type} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {housing_types.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {rental_periods.length > 0 && (
          <section>
            <SectionTitle>Срок аренды</SectionTitle>
            <div className="rounded-lg border bg-background p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={rental_periods}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => PERIOD_LABELS[v] || v}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [value, "Заявок"]}
                    labelFormatter={(v) => PERIOD_LABELS[v] || v}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
      </div>

      {/* ── Роли пользователей ── */}
      {user_roles.length > 0 && (
        <section>
          <SectionTitle>Пользователи по ролям</SectionTitle>
          <div className="flex flex-wrap gap-4">
            {user_roles.map((r, i) => (
              <div key={r.role} className="rounded-lg border bg-background p-4 flex items-center gap-3 min-w-[160px]">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <div>
                  <div className="text-xs text-muted-foreground">{ROLE_LABELS[r.role] || r.role}</div>
                  <div className="text-xl font-bold text-foreground">{r.count}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}