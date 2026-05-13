import { useState } from "react";
import { adminApi, FeedbackMessage, FeedbackFilter } from "@/hooks/useAdminApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import {
  formatDateTime as formatDate,
  FEEDBACK_STATUS_LABELS as STATUS_LABELS,
  FEEDBACK_STATUS_BADGE as STATUS_BADGE,
  FEEDBACK_SUBJECT_BADGE as SUBJECT_BADGE,
} from "@/lib/admin";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import AdminDetailPanel from "@/components/admin/AdminDetailPanel";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/admin/useAdminList";

export default function AdminFeedback() {
  const {
    items: messages,
    total,
    pages,
    filter,
    searchInput,
    loading,
    error,
    extra,
    setSearchInput,
    setFilter,
    handleSearch,
    handleFilterChange,
    handlePage,
  } = useAdminList<FeedbackMessage, FeedbackFilter>({
    initialFilter: { search: "", status: "all", page: 1, limit: 20 },
    fetchFn: async (f) => {
      const res = await adminApi.getFeedback(f);
      return { items: res.messages, total: res.total, pages: res.pages, unread_count: res.unread_count };
    },
    errorText: "Не удалось загрузить обращения",
  });

  const unreadCount = (extra.unread_count as number) ?? 0;

  const [selected, setSelected] = useState<FeedbackMessage | null>(null);
  const [mobilePanel, setMobilePanel] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  const handleStatusFilter = (value: string) => handleFilterChange("status", value, "");

  const closePanelMobile = () => {
    setMobilePanel(false);
    setSelected(null);
  };

  const openPanel = async (msg: FeedbackMessage) => {
    setSelected(msg);
    setMobilePanel(true);
    setReplyText("");
    setReplySuccess(false);
    if (msg.status === "new") {
      try {
        await adminApi.markFeedbackRead(msg.id);
        setFilter((f) => ({ ...f }));
        setSelected((prev) => prev ? { ...prev, status: "read" } : prev);
      } catch (_e) {
        console.error("Ошибка пометки прочитанным", _e);
      }
    }
  };

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    setReplyLoading(true);
    setReplySuccess(false);
    try {
      await adminApi.replyFeedback(selected.id, replyText.trim());
      const updatedMsg: FeedbackMessage = {
        ...selected,
        status: "replied",
        admin_reply: replyText.trim(),
        replied_at: new Date().toISOString(),
      };
      setSelected(updatedMsg);
      setFilter((f) => ({ ...f }));
      setReplyText("");
      setReplySuccess(true);
    } catch (_e) {
      console.error("Ошибка отправки ответа", _e);
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* Основная область — скрываем на мобильных когда открыта панель */}
      <div className={`flex-1 p-6 overflow-auto ${mobilePanel ? "hidden md:block" : "block"}`}>
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">Обратная связь</h1>
            {unreadCount > 0 && (
              <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">
                {unreadCount} новых
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Всего: {total}</p>
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-3 mb-5">
          <AdminSearchBar
            value={searchInput}
            placeholder="Поиск по email, теме, тексту..."
            onChange={setSearchInput}
            onSearch={handleSearch}
          />
          <Select defaultValue="all" onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="new">Новые</SelectItem>
              <SelectItem value="read">Прочитанные</SelectItem>
              <SelectItem value="replied">Отвеченные</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Список */}
        <AdminLoadingState loading={loading} error={error} empty={messages.length === 0} emptyText="Обращений не найдено">
          <>
            <div className="space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => openPanel(msg)}
                  className={`rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/20 ${
                    selected?.id === msg.id ? "bg-primary/5 border-primary/20" : "bg-background"
                  } ${msg.status === "new" ? "border-blue-200" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{msg.email}</span>
                        <StatusBadge status={msg.subject_type} labels={{[msg.subject_type]: msg.subject_type}} styles={SUBJECT_BADGE} />
                        <StatusBadge status={msg.status} labels={STATUS_LABELS} styles={STATUS_BADGE} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.message}</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDate(msg.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <AdminPagination page={filter.page || 1} pages={pages} onPage={handlePage} />
          </>
        </AdminLoadingState>
      </div>

      {/* Боковая панель */}
      {selected && (
        <AdminDetailPanel title="Обращение" mobileOpen={mobilePanel} onClose={closePanelMobile}>
          <div className="p-5 space-y-5">
            {/* Мета */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={selected.subject_type} labels={{[selected.subject_type]: selected.subject_type}} styles={SUBJECT_BADGE} />
                <StatusBadge status={selected.status} labels={STATUS_LABELS} styles={STATUS_BADGE} />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="Mail" size={14} className="text-muted-foreground" />
                <a href={`mailto:${selected.email}`} className="text-primary hover:underline">
                  {selected.email}
                </a>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(selected.created_at)}
              </div>
            </div>

            {/* Текст обращения */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Сообщение</div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              </div>
            </div>

            {/* Предыдущий ответ */}
            {selected.admin_reply && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Ответ администратора
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.admin_reply}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(selected.replied_at)}</p>
                </div>
              </div>
            )}

            {/* Форма ответа */}
            <div className="space-y-3 pt-2 border-t">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {selected.admin_reply ? "Отправить ещё ответ" : "Ответить на email"}
              </div>
              <Textarea
                placeholder="Введите текст ответа..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="text-sm resize-none"
              />
              {replySuccess && (
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <Icon name="CheckCircle" size={14} />
                  Ответ успешно отправлен на {selected.email}
                </div>
              )}
              <Button
                className="w-full"
                size="sm"
                disabled={replyLoading || !replyText.trim()}
                onClick={handleReply}
              >
                {replyLoading ? (
                  <Icon name="Loader2" size={14} className="animate-spin mr-1.5" />
                ) : (
                  <Icon name="Send" size={14} className="mr-1.5" />
                )}
                Отправить ответ
              </Button>
            </div>
          </div>
        </AdminDetailPanel>
      )}
    </div>
  );
}