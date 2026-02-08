import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { escrowStore } from "@/store/escrowStore";

interface EscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentAmount: string;
  chatId: string;
  recommendationId: string;
  requestName: string;
  tenantEmail: string;
  tenantName: string;
  recommenderEmail: string;
  recommenderName: string;
}

export const EscrowModal = ({ 
  isOpen, 
  onClose, 
  rentAmount,
  chatId,
  recommendationId,
  requestName,
  tenantEmail,
  tenantName,
  recommenderEmail,
  recommenderName
}: EscrowModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const rent = parseFloat(rentAmount.replace(/\s/g, '')) || 0;
  const commission = Math.round(rent * 0.5);
  
  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      escrowStore.createTransaction({
        chatId,
        recommendationId,
        requestName,
        tenantEmail,
        tenantName,
        recommenderEmail,
        recommenderName,
        rentAmount: rent,
        commissionAmount: commission,
      });
      
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
        alert('Сделка создана! Проверьте раздел "Баланс"');
      }, 1000);
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon name="ShieldCheck" size={24} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Условия сделки</h2>
                    <p className="text-sm text-muted-foreground">{requestName}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="X" size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Icon name="Info" size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Безопасная сделка через эскроу</p>
                    <p className="text-blue-700">
                      Средства будут переведены рекомендателю после подтверждения обеими сторонами
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Стоимость аренды</span>
                    <span className="text-2xl font-bold text-foreground">
                      {rentAmount} ₽
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">за месяц</p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border-2 border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon name="Gift" size={18} className="text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        Вознаграждение рекомендателю
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {commission.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {recommenderName} получит 50% от стоимости месяца аренды
                  </p>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <Icon name="AlertCircle" size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-900">
                    <p className="font-medium mb-1">Как работает эскроу?</p>
                    <ul className="space-y-1 text-amber-800 text-xs">
                      <li>• Вы переводите деньги на защищённый счёт</li>
                      <li>• Средства заморожены до подтверждения сделки</li>
                      <li>• После переезда рекомендатель получит вознаграждение</li>
                      <li>• В случае отмены — полный возврат средств</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-gray-50">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Отменить
                </Button>
                <Button
                  onClick={handlePayment}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <Icon name="Loader2" size={18} className="animate-spin" />
                      Обработка...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Icon name="CreditCard" size={18} />
                      Перейти к оплате
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};