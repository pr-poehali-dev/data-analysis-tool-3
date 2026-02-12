import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Upload, Sofa, Zap } from "lucide-react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import { authStore } from "@/store/authStore";
import { recommendationsStore } from "@/store/recommendationsStore";
import { messagesStore } from "@/store/messagesStore";
import { requestsStore } from "@/store/requestsStore";

type Step = "invite" | "property";

export const SuggestProperty = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("invite");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState(
    "Здравствуйте! Я рекомендую ваше жильё арендатору через платформу SovetPay. Это безопасный способ сдать квартиру без агентских комиссий. Пожалуйста, зарегистрируйтесь на платформе, чтобы подтвердить объект."
  );
  const [copiedRequestLink, setCopiedRequestLink] = useState(false);
  
  const requestData = location.state as { requestId?: string; requestName?: string; fromDashboard?: boolean } | undefined;
  
  const [propertyData, setPropertyData] = useState({
    address: "",
    coordinates: [55.751574, 37.573856] as [number, number],
    area: "",
    floor: "",
    totalFloors: "",
    rooms: "",
    hasFurniture: false,
    hasAppliances: false,
    rent: "",
    comments: "",
  });

  const [photos, setPhotos] = useState<File[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 20) {
      toast({
        title: "Превышен лимит",
        description: "Можно загрузить максимум 20 фотографий",
        variant: "destructive",
      });
      return;
    }
    setPhotos([...photos, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleInviteNext = () => {
    if (!inviteEmail) {
      toast({
        title: "Ошибка",
        description: "Укажите email владельца",
        variant: "destructive",
      });
      return;
    }
    setStep("property");
  };

  const handleSubmit = () => {
    if (!propertyData.address || !propertyData.rent) {
      toast({
        title: "Ошибка",
        description: "Заполните обязательные поля",
        variant: "destructive",
      });
      return;
    }

    const user = authStore.getUser();
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Необходимо войти в систему",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const photoUrls = photos.map(photo => URL.createObjectURL(photo));

    const recommendation = recommendationsStore.addRecommendation({
      userId: user.email,
      requestId: requestData?.requestId,
      requestName: requestData?.requestName,
      ownerEmail: inviteEmail,
      inviteMessage,
      propertyData: {
        ...propertyData,
        area: propertyData.area || '',
        floor: propertyData.floor || '',
        totalFloors: propertyData.totalFloors || '',
        rooms: propertyData.rooms || '',
        comments: propertyData.comments || '',
      },
      photos: photoUrls,
    });

    if (requestData?.requestId) {
      const request = requestsStore.getRequests().find(r => r.id === requestData.requestId);
      if (request) {
        const existingChat = messagesStore.getChatByRecommendation(recommendation.id);
        if (!existingChat) {
          const tenantUser = authStore.getUser();
          const tenantPhoto = tenantUser?.email === request.email ? tenantUser.photo : undefined;
          const tenantVkLink = tenantUser?.email === request.email ? tenantUser.vkLink : undefined;
          
          messagesStore.createChat({
            recommendationId: recommendation.id,
            requestId: requestData.requestId,
            requestName: requestData.requestName || request.name,
            recommenderEmail: user.email,
            recommenderName: `${user.firstName} ${user.lastName}`,
            recommenderPhoto: user.photo,
            recommenderVkLink: user.vkLink,
            tenantEmail: request.email,
            tenantName: request.name,
            tenantPhoto: tenantPhoto,
            tenantVkLink: tenantVkLink,
          });
        }
      }
    }

    setInviteEmail("");
    setInviteMessage("Здравствуйте! Я рекомендую ваше жильё арендатору через платформу SovetPay. Это безопасный способ сдать квартиру без агентских комиссий. Пожалуйста, зарегистрируйтесь на платформе, чтобы подтвердить объект.");
    setPropertyData({
      address: "",
      coordinates: [55.751574, 37.573856] as [number, number],
      area: "",
      floor: "",
      totalFloors: "",
      rooms: "",
      hasFurniture: false,
      hasAppliances: false,
      rent: "",
      comments: "",
    });
    setPhotos([]);
    setStep("invite");

    toast({
      title: "Предложение отправлено!",
      description: "Можете предложить ещё варианты по этой заявке",
    });
    
    if (!requestData?.requestId) {
      navigate("/dashboard", { state: { activeSection: "feed" } });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => {
              if (step === "property") {
                setStep("invite");
              } else {
                const user = authStore.getUser();
                if (user || requestData?.fromDashboard) {
                  navigate("/dashboard", { state: { activeSection: "feed" } });
                } else {
                  navigate("/feed");
                }
              }
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step === "invite" ? "bg-primary text-white" : "bg-green-500 text-white"}`}>
              1
            </div>
            <div className={`flex-1 h-1 ${step === "property" ? "bg-green-500" : "bg-gray-300"}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step === "property" ? "bg-primary text-white" : "bg-gray-300 text-gray-600"}`}>
              2
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className={step === "invite" ? "text-primary font-medium" : "text-gray-600"}>
              Пригласить владельца
            </span>
            <span className={step === "property" ? "text-primary font-medium" : "text-gray-600"}>
              Описание объекта
            </span>
          </div>
        </div>

        {step === "invite" && (
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
                  value={`Здравствуйте! Я хочу порекомендовать ваше жилье через платформу SovetPay. Это безопасный способ сдать недвижимость по рекомендации. Пожалуйста, рассмотрите карточку арендатора по ссылке:\n\n${window.location.origin}/request/${requestData?.requestId || ''}`}
                  readOnly
                  rows={6}
                  className="bg-gray-50 resize-none"
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const message = `Здравствуйте! Я хочу порекомендовать ваше жилье через платформу SovetPay. Это безопасный способ сдать недвижимость по рекомендации. Пожалуйста, рассмотрите карточку арендатора по ссылке:\n\n${window.location.origin}/request/${requestData?.requestId || ''}`;
                      await navigator.clipboard.writeText(message);
                      setCopiedRequestLink(true);
                      setTimeout(() => setCopiedRequestLink(false), 2000);
                    } catch (err) {
                      console.error('Failed to copy:', err);
                    }
                  }}
                  className="w-full"
                >
                  <Icon name={copiedRequestLink ? "Check" : "Copy"} size={16} className="mr-2" />
                  {copiedRequestLink ? "Скопировано" : "Копировать сообщение"}
                </Button>
              </div>

              <Button
                onClick={handleInviteNext}
                className="w-full"
              >
                Далее
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "property" && (
          <Card>
            <CardHeader>
              <CardTitle>Шаг 2: Описание объекта</CardTitle>
              <CardDescription>
                Укажите характеристики жилья для рекомендации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address">Адрес объекта *</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Например: Москва, ул. Тверская, д. 10"
                  value={propertyData.address}
                  onChange={(e) => setPropertyData({ ...propertyData, address: e.target.value })}
                  required
                />

              </div>

              <div className="space-y-2">
                <Label>Фотографии (до 20 шт.)</Label>
                <div className="grid grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Фото ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {photos.length < 20 && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#156d95] hover:bg-gray-50 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">Загрузить</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Загружено: {photos.length}/20
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Площадь, м²</Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="45"
                    value={propertyData.area}
                    onChange={(e) => setPropertyData({ ...propertyData, area: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rooms">Комнат</Label>
                  <Input
                    id="rooms"
                    type="number"
                    placeholder="2"
                    value={propertyData.rooms}
                    onChange={(e) => setPropertyData({ ...propertyData, rooms: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="floor">Этаж</Label>
                  <Input
                    id="floor"
                    type="number"
                    placeholder="5"
                    value={propertyData.floor}
                    onChange={(e) => setPropertyData({ ...propertyData, floor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalFloors">Всего этажей</Label>
                  <Input
                    id="totalFloors"
                    type="number"
                    placeholder="9"
                    value={propertyData.totalFloors}
                    onChange={(e) => setPropertyData({ ...propertyData, totalFloors: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Удобства</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="furniture"
                    checked={propertyData.hasFurniture}
                    onChange={(e) => setPropertyData({ ...propertyData, hasFurniture: e.target.checked })}
                    className="w-4 h-4 text-[#156d95] rounded"
                  />
                  <label htmlFor="furniture" className="flex items-center gap-2 cursor-pointer">
                    <Sofa className="w-5 h-5 text-gray-600" />
                    <span>Мебель</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="appliances"
                    checked={propertyData.hasAppliances}
                    onChange={(e) => setPropertyData({ ...propertyData, hasAppliances: e.target.checked })}
                    className="w-4 h-4 text-[#156d95] rounded"
                  />
                  <label htmlFor="appliances" className="flex items-center gap-2 cursor-pointer">
                    <Zap className="w-5 h-5 text-gray-600" />
                    <span>Техника</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rent">Сумма аренды в месяц, ₽ *</Label>
                <Input
                  id="rent"
                  type="number"
                  placeholder="30000"
                  value={propertyData.rent}
                  onChange={(e) => setPropertyData({ ...propertyData, rent: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Комментарии для арендатора</Label>
                <Textarea
                  id="comments"
                  placeholder="Дополнительная информация об объекте, особенности, близость к метро и т.д."
                  value={propertyData.comments}
                  onChange={(e) => setPropertyData({ ...propertyData, comments: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full"
              >
                Отправить предложение
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};