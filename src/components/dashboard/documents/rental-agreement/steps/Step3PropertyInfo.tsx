import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormStepProps } from "../types";

export const Step3PropertyInfo = ({ formData, updateField }: FormStepProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground mb-4">Объект аренды</h3>
      <div>
        <Label htmlFor="propertyType">Тип жилья</Label>
        <Select value={formData.propertyType} onValueChange={(value) => updateField("propertyType", value)}>
          <SelectTrigger id="propertyType">
            <SelectValue placeholder="Выберите тип жилья" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apartment">Квартира</SelectItem>
            <SelectItem value="room">Комната</SelectItem>
            <SelectItem value="house">Дом</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="propertyAddress">Адрес объекта</Label>
        <Input
          id="propertyAddress"
          value={formData.propertyAddress}
          onChange={(e) => updateField("propertyAddress", e.target.value)}
          placeholder="г. Москва, ул. Ленина, д. 1, кв. 1"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="propertyArea">Площадь (кв.м)</Label>
          <Input
            id="propertyArea"
            value={formData.propertyArea}
            onChange={(e) => updateField("propertyArea", e.target.value)}
            placeholder="50"
          />
        </div>
        <div>
          <Label htmlFor="propertyRooms">Комнат</Label>
          <Input
            id="propertyRooms"
            value={formData.propertyRooms}
            onChange={(e) => updateField("propertyRooms", e.target.value)}
            placeholder="2"
          />
        </div>
        <div>
          <Label htmlFor="propertyFloor">Этаж</Label>
          <Input
            id="propertyFloor"
            value={formData.propertyFloor}
            onChange={(e) => updateField("propertyFloor", e.target.value)}
            placeholder="5"
          />
        </div>
      </div>
    </div>
  );
};

export default Step3PropertyInfo;
