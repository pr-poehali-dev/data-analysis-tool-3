import { useState } from "react";
import { Upload, Sofa, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";

export interface PropertyData {
  address: string;
  coordinates: [number, number];
  area: string;
  floor: string;
  totalFloors: string;
  rooms: string;
  hasFurniture: boolean;
  hasAppliances: boolean;
  rent: string;
  comments: string;
}

interface PropertyDetailsStepProps {
  propertyData: PropertyData;
  onPropertyDataChange: (data: PropertyData) => void;
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const PropertyDetailsStep = ({
  propertyData,
  onPropertyDataChange,
  photos,
  onPhotosChange,
  onSubmit,
  isSubmitting,
}: PropertyDetailsStepProps) => {
  const { toast } = useToast();
  const [floorError, setFloorError] = useState<string>("");

  const validateFloor = (floor: string, totalFloors: string) => {
    if (floor === "" || totalFloors === "") {
      setFloorError("");
      return true;
    }
    const floorValue = parseInt(floor);
    const totalFloorsValue = parseInt(totalFloors);
    if (isNaN(floorValue) || isNaN(totalFloorsValue)) {
      setFloorError("");
      return true;
    }
    if (floorValue >= totalFloorsValue) {
      setFloorError("Этаж должен быть меньше общего количества этажей");
      return false;
    }
    setFloorError("");
    return true;
  };

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
    onPhotosChange([...photos, ...files]);
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const update = (partial: Partial<PropertyData>) => {
    onPropertyDataChange({ ...propertyData, ...partial });
  };

  return (
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
            onChange={(e) => update({ address: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Фотографии (до 20 шт.)</Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
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
              onChange={(e) => update({ area: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rooms">Комнат</Label>
            <Input
              id="rooms"
              type="number"
              placeholder="2"
              value={propertyData.rooms}
              onChange={(e) => update({ rooms: e.target.value })}
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
              onChange={(e) => {
                const value = e.target.value;
                update({ floor: value });
                validateFloor(value, propertyData.totalFloors);
              }}
              className={floorError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalFloors">Всего этажей</Label>
            <Input
              id="totalFloors"
              type="number"
              placeholder="9"
              value={propertyData.totalFloors}
              onChange={(e) => {
                const value = e.target.value;
                update({ totalFloors: value });
                validateFloor(propertyData.floor, value);
              }}
              className={floorError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
          </div>
        </div>
        {floorError && (
          <p className="text-xs text-red-500 -mt-4 flex items-center gap-1">
            <Icon name="AlertCircle" size={12} />
            {floorError}
          </p>
        )}

        <div className="space-y-3">
          <Label>Удобства</Label>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="furniture"
              checked={propertyData.hasFurniture}
              onChange={(e) => update({ hasFurniture: e.target.checked })}
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
              onChange={(e) => update({ hasAppliances: e.target.checked })}
              className="w-4 h-4 text-[#156d95] rounded"
            />
            <label htmlFor="appliances" className="flex items-center gap-2 cursor-pointer">
              <Zap className="w-5 h-5 text-gray-600" />
              <span>Техника</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rent">Стоимость аренды (₽/мес) *</Label>
          <Input
            id="rent"
            type="number"
            placeholder="30000"
            value={propertyData.rent}
            onChange={(e) => update({ rent: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comments">Дополнительная информация</Label>
          <textarea
            id="comments"
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Укажите дополнительные детали об объекте..."
            value={propertyData.comments}
            onChange={(e) => update({ comments: e.target.value })}
          />
        </div>

        <Button onClick={onSubmit} className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Отправка..." : "Отправить предложение"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PropertyDetailsStep;