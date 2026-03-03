import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InviteOwnerStep } from "@/components/suggest-property/InviteOwnerStep";
import { PropertyDetailsStep } from "@/components/suggest-property/PropertyDetailsStep";
import type { PropertyData } from "@/components/suggest-property/PropertyDetailsStep";

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
  const inviteEmail = "";
  const inviteMessage = "Здравствуйте! Я рекомендую ваше жильё арендатору через платформу SovetPay. Это безопасный способ сдать квартиру без агентских комиссий. Пожалуйста, зарегистрируйтесь на платформе, чтобы подтвердить объект.";
  
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

  useEffect(() => {
    if (requestData?.requestId) {
      const cached = requestsStore.getRequestById(requestData.requestId);
      if (!cached) {
        requestsStore.fetchRequestById(requestData.requestId);
      }
    }
  }, [requestData?.requestId]);

  const handleInviteNext = () => {
    setStep("property");
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
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

    if (requestData?.requestId) {
      const request = requestsStore.getRequestById(requestData.requestId);
      const requestOwnerEmail = request?.userEmail || request?.userId;
      if (requestOwnerEmail && requestOwnerEmail.toLowerCase() === user.email.toLowerCase()) {
        toast({
          title: "Нельзя отправить предложение",
          description: "Вы не можете предложить вариант на свою же заявку",
          variant: "destructive",
        });
        return;
      }
    }

    let photoUrls: string[] = [];
    try {
      photoUrls = await Promise.all(photos.map(fileToDataUrl));
    } catch {
      photoUrls = [];
    }

    const userId = user.email || `user_${Date.now()}`;

    let recommendation;
    try {
      recommendation = await recommendationsStore.addRecommendation({
        userId,
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
    } catch (err) {
      console.error("Ошибка отправки предложения:", err);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить предложение. Попробуйте позже.",
        variant: "destructive",
      });
      return;
    }

    if (requestData?.requestId) {
      const request = requestsStore.getRequestById(requestData.requestId);
      if (request) {
        await messagesStore.fetchChatByRecommendation(recommendation.id);
        const existingChat = messagesStore.getChatByRecommendation(recommendation.id);
        if (!existingChat) {
          const tenantUser = authStore.getUser();
          const tenantEmail = request.userEmail || request.userId;
          const tenantPhoto = tenantUser?.email === tenantEmail ? tenantUser.photo : undefined;
          const tenantVkLink = tenantUser?.email === tenantEmail ? tenantUser.vkLink : undefined;
          
          await messagesStore.createChat({
            recommendationId: recommendation.id,
            requestId: requestData.requestId,
            requestName: requestData.requestName || request.name,
            recommenderEmail: user.email,
            recommenderName: `${user.firstName} ${user.lastName}`,
            recommenderPhoto: user.photo,
            recommenderVkLink: user.vkLink,
            tenantEmail: request.userEmail || request.userId,
            tenantName: request.name,
            tenantPhoto: tenantPhoto,
            tenantVkLink: tenantVkLink,
          });
        }
      }
    }

    toast({
      title: "Предложение отправлено!",
      description: "Ваше предложение успешно отправлено арендатору",
    });

    navigate("/dashboard", { state: { activeSection: "feed" } });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
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
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground border border-border rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm sm:text-base ${step === "invite" ? "bg-primary text-white" : "bg-green-500 text-white"}`}>
              1
            </div>
            <div className={`flex-1 h-1 ${step === "property" ? "bg-green-500" : "bg-gray-300"}`} />
            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm sm:text-base ${step === "property" ? "bg-primary text-white" : "bg-gray-300 text-gray-600"}`}>
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
          <InviteOwnerStep
            requestId={requestData?.requestId}
            onNext={handleInviteNext}
          />
        )}

        {step === "property" && (
          <PropertyDetailsStep
            propertyData={propertyData}
            onPropertyDataChange={setPropertyData}
            photos={photos}
            onPhotosChange={setPhotos}
            onSubmit={handleSubmit}
          />
        )}
      </main>
    </div>
  );
};