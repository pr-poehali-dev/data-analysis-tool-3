import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authStore } from "@/store/authStore";
import { recommendationsStore } from "@/store/recommendationsStore";
import { messagesStore } from "@/store/messagesStore";
import { requestsStore } from "@/store/requestsStore";
import type { PropertyData } from "./PropertyDetailsStep";

interface SubmissionParams {
  propertyData: PropertyData;
  photos: File[];
  requestId?: string;
  requestName?: string;
  inviteEmail: string;
  inviteMessage: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export function usePropertySubmission() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const submit = async (params: SubmissionParams) => {
    const { propertyData, photos, requestId, requestName, inviteEmail, inviteMessage } = params;

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

    if (requestId) {
      const request = requestsStore.getRequestById(requestId);
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
        requestId,
        requestName,
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

    if (requestId) {
      const request = requestsStore.getRequestById(requestId);
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
            requestId,
            requestName: requestName || request.name,
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

  return { submit };
}
