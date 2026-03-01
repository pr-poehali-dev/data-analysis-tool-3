import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { escrowStore, EscrowTransaction } from "@/store/escrowStore";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardBalanceSectionProps {
  userEmail: string;
  userName: string;
}

const statusConfig = {
  frozen: {
    label: 'Заморожено',
    icon: 'Lock',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  completed: {
    label: 'Завершено',
    icon: 'CheckCircle2',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200'
  },
  pending: {
    label: 'Ожидает',
    icon: 'Clock',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200'
  },
  cancelled: {
    label: 'Отменено',
    icon: 'XCircle',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200'
  },
  refunded: {
    label: 'Возвращено',
    icon: 'RotateCcw',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  }
};

export const DashboardBalanceSection = ({ userEmail, userName }: DashboardBalanceSectionProps) => {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [balance, setBalance] = useState({ frozen: 0, completed: 0, pending: 0, sent: 0 });
  const [filter, setFilter] = useState<'all' | EscrowTransaction['status']>('all');

  useEffect(() => {
    const loadData = async () => {
      const [userTransactions, userBalance] = await Promise.all([
        escrowStore.fetchUserTransactions(userEmail),
        escrowStore.fetchUserBalance(userEmail),
      ]);
      setTransactions(userTransactions);
      setBalance(userBalance);
    };

    loadData();
    const unsubscribe = escrowStore.subscribe(() => { loadData(); });
    return unsubscribe;
  }, [userEmail]);

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.status === filter);

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Баланс</h2>

      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg relative"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-60 hover:opacity-100 transition-opacity">
                  <Icon name="HelpCircle" size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] text-center">
                Сумма вознаграждений, замороженных на эскроу-счёте по вашим рекомендациям до завершения сделки
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center justify-between mb-2 mt-5">
              <Icon name="Lock" size={24} className="opacity-80" />
              <span className="text-sm opacity-80">На эскроу</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mb-1">
              {balance.frozen.toLocaleString('ru-RU')} ₽
            </div>
            <p className="text-xs opacity-80">Средства в процессе</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white shadow-lg relative"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-60 hover:opacity-100 transition-opacity">
                  <Icon name="HelpCircle" size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] text-center">
                Общая сумма вознаграждений, полученных вами как рекомендателем по завершённым сделкам
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center justify-between mb-2 mt-5">
              <Icon name="CheckCircle2" size={24} className="opacity-80" />
              <span className="text-sm opacity-80">Получено</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mb-1">
              {balance.completed.toLocaleString('ru-RU')} ₽
            </div>
            <p className="text-xs opacity-80">Завершённые сделки</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 sm:p-6 text-white shadow-lg relative"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-60 hover:opacity-100 transition-opacity">
                  <Icon name="HelpCircle" size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] text-center">
                Сумма, замороженная на эскроу по вашим заявкам как арендатора до подтверждения сделки
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center justify-between mb-2 mt-5">
              <Icon name="Clock" size={24} className="opacity-80" />
              <span className="text-sm opacity-80">К оплате</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mb-1">
              {balance.pending.toLocaleString('ru-RU')} ₽
            </div>
            <p className="text-xs opacity-80">Ожидающие платежи</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 sm:p-6 text-white shadow-lg relative"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-60 hover:opacity-100 transition-opacity">
                  <Icon name="HelpCircle" size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] text-center">
                Общая сумма средств, отправленных вами как арендатором рекомендателям по завершённым сделкам
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center justify-between mb-2 mt-5">
              <Icon name="Send" size={24} className="opacity-80" />
              <span className="text-sm opacity-80">Отправлено</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mb-1">
              {balance.sent.toLocaleString('ru-RU')} ₽
            </div>
            <p className="text-xs opacity-80">Завершённые сделки</p>
          </motion.div>
        </div>
      </TooltipProvider>

      <div className="bg-white rounded-xl border border-border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-foreground">История транзакций</h3>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
                filter === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-foreground hover:bg-gray-200'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter('frozen')}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
                filter === 'frozen' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-foreground hover:bg-gray-200'
              }`}
            >
              Активные
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
                filter === 'completed' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-foreground hover:bg-gray-200'
              }`}
            >
              Завершённые
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Wallet" size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Нет транзакций
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {filter === 'all' 
                ? 'Здесь будет отображаться история ваших эскроу-сделок'
                : `Нет транзакций со статусом "${statusConfig[filter as keyof typeof statusConfig].label}"`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction, index) => {
              const config = statusConfig[transaction.status];
              const isRecommender = transaction.recommenderEmail === userEmail;
              const otherParty = isRecommender ? transaction.tenantName : transaction.recommenderName;
              const amount = transaction.commissionAmount;

              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border rounded-lg p-3 sm:p-4 ${config.border} ${config.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg} border ${config.border}`}>
                      <Icon name={config.icon} size={16} className={`sm:w-5 sm:h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">
                          {transaction.requestName}
                        </h4>
                        <span className={`text-sm sm:text-lg font-bold whitespace-nowrap ${config.color}`}>
                          {isRecommender ? '+' : '-'}{amount.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate">
                        {isRecommender ? 'Вознаграждение от' : 'Оплата для'} {otherParty}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Icon name="Calendar" size={12} className="sm:w-[14px] sm:h-[14px]" />
                          {format(transaction.createdAt, "d MMM yyyy, HH:mm", { locale: ru })}
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded ${config.bg} ${config.color} font-medium`}>
                          <Icon name={config.icon} size={12} className="sm:w-[14px] sm:h-[14px]" />
                          {config.label}
                        </div>
                      </div>
                      {transaction.completedAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Завершено: {format(transaction.completedAt, "d MMM yyyy, HH:mm", { locale: ru })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};