import { useState, useEffect, useCallback } from "react";
import { adminApi, AdminUser, AdminUserDetail, UsersFilter } from "@/hooks/useAdminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { formatDate, ROLE_LABELS } from "@/lib/admin";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import AdminDetailPanel from "@/components/admin/AdminDetailPanel";

function getInitials(user: AdminUser): string {
  if (user.first_name || user.last_name) {
    return `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase();
  }
  return (user.email || "?")[0].toUpperCase();
}

export default function AdminUsers() {
  const [filter, setFilter] = useState<UsersFilter>({
    search: "",
    role: "",
    status: "all",
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(false);

  const loadUsers = useCallback(async (f: UsersFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUsers(f);
      setUsers(res.users);
      setTotal(res.total);
      setPages(res.pages);
    } catch {
      setError("Не удалось загрузить список пользователей");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(filter);
  }, [filter, loadUsers]);

  const handleSearch = () => {
    setFilter((f) => ({ ...f, search: searchInput, page: 1 }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleRoleChange = (value: string) => {
    setFilter((f) => ({ ...f, role: value === "all" ? "" : value, page: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setFilter((f) => ({ ...f, status: value as UsersFilter["status"], page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilter((f) => ({ ...f, page: newPage }));
  };

  const openUserPanel = async (user: AdminUser) => {
    setPanelLoading(true);
    setSelectedUser(null);
    setShowBlockForm(false);
    setBlockReason("");
    setMobilePanel(true);
    try {
      const detail = await adminApi.getUser(user.id);
      setSelectedUser(detail);
    } catch {
      setSelectedUser(null);
    } finally {
      setPanelLoading(false);
    }
  };

  const closePanelMobile = () => {
    setMobilePanel(false);
    setSelectedUser(null);
  };

  const handleBlock = async () => {
    if (!selectedUser) return;
    setBlockLoading(true);
    try {
      await adminApi.blockUser(selectedUser.id, true, blockReason);
      const updated = await adminApi.getUser(selectedUser.id);
      setSelectedUser(updated);
      setShowBlockForm(false);
      setBlockReason("");
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, is_blocked: true } : u))
      );
    } catch (_e) {
      console.error("Ошибка блокировки", _e);
    } finally {
      setBlockLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!selectedUser) return;
    setBlockLoading(true);
    try {
      await adminApi.blockUser(selectedUser.id, false);
      const updated = await adminApi.getUser(selectedUser.id);
      setSelectedUser(updated);
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, is_blocked: false } : u))
      );
    } catch (_e) {
      console.error("Ошибка разблокировки", _e);
    } finally {
      setBlockLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Основная область — скрываем на мобильных когда открыта панель */}
      <div className={`flex-1 p-6 overflow-auto ${mobilePanel ? "hidden md:block" : "block"}`}>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Пользователи</h1>
          <p className="text-sm text-muted-foreground mt-1">Всего: {total}</p>
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-3 mb-5">
          <AdminSearchBar
            value={searchInput}
            placeholder="Поиск по имени, email, телефону..."
            onChange={setSearchInput}
            onSearch={handleSearch}
          />

          <Select defaultValue="all" onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Роль" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все роли</SelectItem>
              <SelectItem value="tenant">Арендатор</SelectItem>
              <SelectItem value="recommender">Рекомендатель</SelectItem>
              <SelectItem value="landlord">Арендодатель</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all" onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="blocked">Заблокированные</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Таблица */}
        <AdminLoadingState loading={loading} error={error} empty={users.length === 0} emptyText="Пользователи не найдены">
          <>
            <div className="rounded-lg border bg-background overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Пользователь</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Заявок</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Дата регистрации</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => openUserPanel(user)}
                      className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/30 ${
                        selectedUser?.id === user.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{user.display_name}</div>
                            <div className="text-xs text-muted-foreground">{user.email || user.phone || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.requests_count}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {user.is_blocked ? (
                          <Badge variant="destructive" className="text-xs">Заблокирован</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">Активен</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            <AdminPagination page={filter.page || 1} pages={pages} onPage={handlePageChange} />
          </>
        </AdminLoadingState>
      </div>

      {/* Боковая панель профиля */}
      {(selectedUser || panelLoading) && (
        <AdminDetailPanel title="Профиль" mobileOpen={mobilePanel} onClose={closePanelMobile}>
          {panelLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Icon name="Loader2" size={20} className="animate-spin mr-2" />
              Загрузка...
            </div>
          ) : selectedUser ? (
            <div className="p-5 space-y-5">
              {/* Аватар и имя */}
              <div className="flex flex-col items-center text-center gap-2">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {getInitials(selectedUser)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-foreground">{selectedUser.display_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    #{selectedUser.id} · {ROLE_LABELS[selectedUser.role] || selectedUser.role}
                  </div>
                </div>
                {selectedUser.is_blocked ? (
                  <Badge variant="destructive" className="text-xs">Заблокирован</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">Активен</Badge>
                )}
              </div>

              {/* Контакты */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Контакты</div>
                <InfoRow icon="Mail" label="Email" value={selectedUser.email} />
                <InfoRow icon="Phone" label="Телефон" value={selectedUser.phone} />
                <InfoRow icon="MapPin" label="Город" value={selectedUser.city} />
                {selectedUser.telegram_username && (
                  <InfoRow icon="MessageCircle" label="Telegram" value={`@${selectedUser.telegram_username}`} />
                )}
                {selectedUser.vk_link && (
                  <InfoRow icon="Link" label="ВКонтакте" value={selectedUser.vk_link} />
                )}
              </div>

              {/* Активность */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Активность</div>
                <div className="grid grid-cols-3 gap-2">
                  <StatCard label="Заявок" value={selectedUser.requests_count} />
                  <StatCard label="Рекоменд." value={selectedUser.recommendations_count} />
                  <StatCard label="Отзывов" value={selectedUser.reviews_count} />
                </div>
              </div>

              {/* Даты */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Даты</div>
                <InfoRow icon="CalendarPlus" label="Регистрация" value={formatDate(selectedUser.created_at)} />
                <InfoRow icon="Clock" label="Последний вход" value={formatDate(selectedUser.last_login_at)} />
              </div>

              {/* Если заблокирован — показываем причину */}
              {selectedUser.is_blocked && selectedUser.blocked_reason && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <div className="text-xs font-medium text-destructive mb-1">Причина блокировки</div>
                  <div className="text-xs text-foreground">{selectedUser.blocked_reason}</div>
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(selectedUser.blocked_at)}</div>
                </div>
              )}

              {/* Кнопки блокировки */}
              <div className="pt-2 border-t space-y-2">
                {selectedUser.is_blocked ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-green-600 border-green-200 hover:bg-green-50"
                    disabled={blockLoading}
                    onClick={handleUnblock}
                  >
                    {blockLoading ? (
                      <Icon name="Loader2" size={14} className="animate-spin mr-1.5" />
                    ) : (
                      <Icon name="ShieldCheck" size={14} className="mr-1.5" />
                    )}
                    Разблокировать
                  </Button>
                ) : (
                  <>
                    {showBlockForm ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Причина блокировки (необязательно)"
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            disabled={blockLoading}
                            onClick={handleBlock}
                          >
                            {blockLoading ? (
                              <Icon name="Loader2" size={14} className="animate-spin mr-1.5" />
                            ) : null}
                            Заблокировать
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowBlockForm(false)}
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
                        onClick={() => setShowBlockForm(true)}
                      >
                        <Icon name="ShieldOff" size={14} className="mr-1.5" />
                        Заблокировать
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : null}
        </AdminDetailPanel>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon name={icon} size={14} className="text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-muted-foreground">{label}: </span>
        <span className="text-foreground">{value || "—"}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-2 text-center">
      <div className="text-lg font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}