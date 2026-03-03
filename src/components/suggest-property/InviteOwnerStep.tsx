import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface InviteOwnerStepProps {
  requestId?: string;
  onNext: () => void;
}

export const InviteOwnerStep = ({ requestId, onNext }: InviteOwnerStepProps) => {
  const [copied, setCopied] = useState(false);

  const message = `Здравствуйте! Я хочу порекомендовать ваше жилье через платформу SovetPay. Это безопасный способ сдать недвижимость по рекомендации. Пожалуйста, рассмотрите карточку арендатора по ссылке:\n\n${window.location.origin}/request/${requestId || ''}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Шаг 1: Оповестить владельца</CardTitle>
        <CardDescription>
          Отправьте ссылку на заявку владельцу для предварительного согласования
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 leading-relaxed">
            Перед отправкой предложения, скопируйте ссылку карточки заявки и отправьте ее владельцу на рассмотрение.
            Если владелец предварительно одобрит арендатора, то продолжите заполнять заявку с вашим предложением.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Сообщение для владельца</Label>
          <Textarea
            value={message}
            readOnly
            rows={6}
            className="bg-gray-50 resize-none"
          />
          <Button variant="outline" onClick={handleCopy} className="w-full">
            <Icon name={copied ? "Check" : "Copy"} size={16} className="mr-2" />
            {copied ? "Скопировано" : "Копировать сообщение"}
          </Button>
        </div>

        <Button onClick={onNext} className="w-full">
          Далее
        </Button>
      </CardContent>
    </Card>
  );
};

export default InviteOwnerStep;
