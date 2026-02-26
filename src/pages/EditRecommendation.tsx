import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Sofa, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import { authStore } from "@/store/authStore";
import { recommendationsStore } from "@/store/recommendationsStore";

export const EditRecommendation = () => {
  const navigate = useNavigate();
  const { recommendationId } = useParams<{ recommendationId: string }>();
  const { toast } = useToast();
  
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

  const [ownerEmail, setOwnerEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!recommendationId) {
      navigate("/", { state: { activeSection: "recommendations" } });
      return;
    }

    const applyRecommendation = (recommendation: NonNullable<ReturnType<typeof recommendationsStore.getRecommendationById>>) => {
      const user = authStore.getUser();
      if (!user || recommendation.userId !== user.email) {
        toast({
          title: "Ошибка",
          description: "У вас нет прав для редактирования этой рекомендации",
          variant: "destructive",
        });
        navigate("/", { state: { activeSection: "recommendations" } });
        return;
      }
      setPropertyData(recommendation.propertyData);
      setOwnerEmail(recommendation.ownerEmail);
      setInviteMessage(recommendation.inviteMessage);
      setPhotos(recommendation.photos);
    };

    const cached = recommendationsStore.getRecommendationById(recommendationId);
    if (cached) {
      applyRecommendation(cached);
    }

    recommendationsStore.fetchRecommendationById(recommendationId).then((fetched) => {
      if (fetched) {
        applyRecommendation(fetched);
      } else if (!cached) {
        toast({
          title: "Ошибка",
          description: "Рекомендация не найдена",
          variant: "destructive",
        });
        navigate("/", { state: { activeSection: "recommendations" } });
      }
    });
  }, [recommendationId, navigate, toast]);

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
    const newPhotos = files.map(file => URL.createObjectURL(file));
    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
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

    if (!recommendationId) return;

    await recommendationsStore.updateRecommendation(recommendationId, {
      ownerEmail,
      inviteMessage,
      propertyData,
      photos,
    });

    toast({
      title: "Успешно",
      description: "Рекомендация обновлена",
    });
    
    navigate("/", { state: { activeSection: "recommendations" } });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate("/", { state: { activeSection: "recommendations" } })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground border border-border rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">
            Редактирование рекомендации
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Внесите необходимые изменения в рекомендацию
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Описание объекта</CardTitle>
            <CardDescription>
              Характеристики жилья для рекомендации
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
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={photo}
                      alt={`Фото ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {photos.length < 20 && (
                  <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Добавить</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rooms">Количество комнат</Label>
                <Input
                  id="rooms"
                  placeholder="1, 2, 3..."
                  value={propertyData.rooms}
                  onChange={(e) => setPropertyData({ ...propertyData, rooms: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Площадь (м²)</Label>
                <Input
                  id="area"
                  type="number"
                  placeholder="45"
                  value={propertyData.area}
                  onChange={(e) => setPropertyData({ ...propertyData, area: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
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
                <Label htmlFor="totalFloors">Этажей в доме</Label>
                <Input
                  id="totalFloors"
                  type="number"
                  placeholder="9"
                  value={propertyData.totalFloors}
                  onChange={(e) => setPropertyData({ ...propertyData, totalFloors: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rent">Стоимость аренды (₽/мес) *</Label>
              <Input
                id="rent"
                type="number"
                placeholder="50000"
                value={propertyData.rent}
                onChange={(e) => setPropertyData({ ...propertyData, rent: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={propertyData.hasFurniture}
                  onChange={(e) => setPropertyData({ ...propertyData, hasFurniture: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <Sofa className="w-5 h-5 text-gray-600" />
                <span className="text-sm">Есть мебель</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={propertyData.hasAppliances}
                  onChange={(e) => setPropertyData({ ...propertyData, hasAppliances: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <Zap className="w-5 h-5 text-gray-600" />
                <span className="text-sm">Есть техника</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Дополнительная информация</Label>
              <Textarea
                id="comments"
                placeholder="Укажите особенности объекта, ремонт, инфраструктуру..."
                value={propertyData.comments}
                onChange={(e) => setPropertyData({ ...propertyData, comments: e.target.value })}
                rows={4}
                className="resize-none"
              />
            </div>

            <Button onClick={handleSubmit} className="w-full">
              Сохранить изменения
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};