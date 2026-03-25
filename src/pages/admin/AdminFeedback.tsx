import { useState, useEffect, useCallback } from "react";
import { adminApi, FeedbackMessage, FeedbackFilter } from "@/hooks/useAdminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const STATUS_LABELS: Record<string, string> = {
  new: "Новое",
  read: "Прочитано",
  replied: "Отвечено",
};

const STATUS_BADGE: Record<string, string> = {
  new: "text-blue-600 border-blue-200 bg-blue-50",
  read: "text-muted-foreground border-muted bg-muted/30",
  replied: "text-green-600 border-green-200 bg-green-50",
};

const SUBJECT_BADGE: Record<string, string> = {
  Проблема: "text-destructive border-destructive/20 bg-destructive/5",
  Вопрос: "text-yellow-600 border-yellow-200 bg-yellow-50",
  Предложение: "text-blue-600 border-blue-200 bg-blue-50",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function AdminFeedback() {
  const [filter, setFilter] = useState<FeedbackFilter>({ search: "", status: "all", page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState("");
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<FeedbackMessage | null>(null);
  const [mobilePanel, setMobilePanel] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  const loadFeedback = useCallback(async (f: FeedbackFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getFeedback(f);
      setMessages(res.messages);
      setTotal(res.total);
      setUnreadCount(res.unread_count);
      setPages(res.pages);
    } catch (_e) {
      setError("Не удалось загрузить обращения");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback(filter);
  }, [filter, loadFeedback]);

  const handleSearch = () => setFilter((f) => ({ ...f, search: searchInput, page: 1 }));
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); };
  const handleStatusFilter = (value: string) => setFilter((f) => ({ ...f, status: value, page: 1 }));
  const handlePage = (newPage: number) => setFilter((f) => ({ ...f, page: newPage }));

  const closePanelMobile = () => {
    setMobilePanel(false);
    setSelected(null);
  };

  const openPanel = async (msg: FeedbackMessage) => {
    setSelected(msg);
    setMobilePanel(true);
    setReplyText("");
    setReplySuccess(false);
    // Помечаем как прочитанное, если новое
    if (msg.status === "new") {
      try {
        await adminApi.markFeedbackRead(msg.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m))
        );
        setSelected((prev) => prev ? { ...prev, status: "read" } : prev);
        setUnreadCount((c) => Math.max(0, c - 1));
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
      setMessages((prev) => prev.map((m) => (m.id === selected.id ? updatedMsg : m)));
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
          <div className="flex gap-2 flex-1 min-w-[220px]">
            <Input
              placeholder="Поиск по email, теме, тексту..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={handleSearch}>
              <Icon name="Search" size={16} />
            </Button>
          </div>
          <Select defaultValue="all" onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-44">
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
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Icon name="Loader2" size={24} className="animate-spin mr-2" />Загрузка...
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Обращений не найдено</div>
        ) : (
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
                        <Badge variant="outline" className={`text-xs ${SUBJECT_BADGE[msg.subject_type] || ""}`}>
                          {msg.subject_type}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${STATUS_BADGE[msg.status] || ""}`}>
                          {STATUS_LABELS[msg.status] || msg.status}
                        </Badge>
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

            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                <Button variant="outline" size="sm" disabled={(filter.page || 1) <= 1} onClick={() => handlePage((filter.page || 1) - 1)}>
                  <Icon name="ChevronLeft" size={16} />
                </Button>
                <span className="text-sm text-muted-foreground">Страница {filter.page || 1} из {pages}</span>
                <Button variant="outline" size="sm" disabled={(filter.page || 1) >= pages} onClick={() => handlePage((filter.page || 1) + 1)}>
                  <Icon name="ChevronRight" size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Боковая панель */}
      {selected && (
        <aside className={`
          bg-background overflow-auto border-l
          md:w-96 md:shrink-0 md:static md:block
          ${mobilePanel ? "fixed inset-0 z-30 w-full" : "hidden md:block"}
        `}>
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <button
                onClick={closePanelMobile}
                className="md:hidden text-muted-foreground hover:text-foreground transition-colors mr-1"
              >
                <Icon name="ArrowLeft" size={18} />
              </button>
              <span className="font-medium text-sm">Обращение</span>
            </div>
            <button
              onClick={() => { setSelected(null); setMobilePanel(false); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Мета */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-xs ${SUBJECT_BADGE[selected.subject_type] || ""}`}>
                  {selected.subject_type}
                </Badge>
                <Badge variant="outline" className={`text-xs ${STATUS_BADGE[selected.status] || ""}`}>
                  {STATUS_LABELS[selected.status] || selected.status}
                </Badge>
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
        </aside>
      )}
    </div>
  );
}