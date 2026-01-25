import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";

interface RequestsFeedFiltersProps {
  selectedCity: string | undefined;
  setSelectedCity: (value: string | undefined) => void;
  selectedDistrict: string | undefined;
  setSelectedDistrict: (value: string | undefined) => void;
  selectedHousingType: string | undefined;
  setSelectedHousingType: (value: string | undefined) => void;
  selectedRoomsCount: string | undefined;
  setSelectedRoomsCount: (value: string | undefined) => void;
  selectedRentalPeriod: string | undefined;
  setSelectedRentalPeriod: (value: string | undefined) => void;
  budget: number[];
  setBudget: (value: number[]) => void;
  getCityOptions: () => { value: string; label: string }[];
  citiesWithDistricts: Record<string, string[]>;
  handleApplyFilters: () => void;
  handleResetFilters: () => void;
}

export const RequestsFeedFilters = ({
  selectedCity,
  setSelectedCity,
  selectedDistrict,
  setSelectedDistrict,
  selectedHousingType,
  setSelectedHousingType,
  selectedRoomsCount,
  setSelectedRoomsCount,
  selectedRentalPeriod,
  setSelectedRentalPeriod,
  budget,
  setBudget,
  getCityOptions,
  citiesWithDistricts,
  handleApplyFilters,
  handleResetFilters,
}: RequestsFeedFiltersProps) => {
  const getDistrictOptions = () => {
    if (!selectedCity) return [];
    const districts = citiesWithDistricts[selectedCity] || [];
    return districts.map(district => ({
      value: district,
      label: district
    }));
  };

  return (
    <div className="bg-white border border-border rounded-lg p-3">
      <div className="flex items-center justify-between gap-4 mb-2">
        <h3 className="text-sm font-semibold text-foreground">Фильтры</h3>
        <div className="flex gap-2">
          <Button onClick={handleApplyFilters} size="sm" className="h-7 px-3 text-xs">
            <Icon name="Search" size={12} className="mr-1" />
            Применить
          </Button>
          <Button variant="outline" onClick={handleResetFilters} size="sm" className="h-7 px-3 text-xs">
            <Icon name="RotateCcw" size={12} className="mr-1" />
            Сбросить
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Город</label>
          <Combobox
            value={selectedCity}
            onValueChange={(value) => {
              setSelectedCity(value === "all" ? undefined : value);
              setSelectedDistrict(undefined);
            }}
            options={[
              { value: "all", label: "Все города" },
              ...getCityOptions()
            ]}
            placeholder="Выберите город"
            searchPlaceholder="Поиск города..."
            emptyText="Город не найден"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Район</label>
          <Combobox
            value={selectedDistrict}
            onValueChange={(value) => setSelectedDistrict(value === "all" ? undefined : value)}
            options={[
              { value: "all", label: "Все районы" },
              ...getDistrictOptions()
            ]}
            placeholder="Выберите район"
            searchPlaceholder="Поиск района..."
            emptyText="Район не найден"
            disabled={!selectedCity}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Тип жилья</label>
          <Select value={selectedHousingType || "all"} onValueChange={(value) => setSelectedHousingType(value === "all" ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Любой тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любой тип</SelectItem>
              <SelectItem value="Квартира">Квартира</SelectItem>
              <SelectItem value="Студия">Студия</SelectItem>
              <SelectItem value="Комната">Комната</SelectItem>
              <SelectItem value="Дом">Дом</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Комнат</label>
          <Select value={selectedRoomsCount || "all"} onValueChange={(value) => setSelectedRoomsCount(value === "all" ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Любое количество" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любое количество</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="4+">Более</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Срок</label>
          <Select value={selectedRentalPeriod || "all"} onValueChange={(value) => setSelectedRentalPeriod(value === "all" ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Любой срок" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любой срок</SelectItem>
              <SelectItem value="1-3">1-3 месяца</SelectItem>
              <SelectItem value="3-6">3-6 месяцев</SelectItem>
              <SelectItem value="6-12">6-12 месяцев</SelectItem>
              <SelectItem value="12+">Более года</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Бюджет, ₽
          </label>
          <Input
            type="number"
            value={budget[0]}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              setBudget([Math.max(0, value)]);
            }}
            placeholder="Введите сумму"
          />
        </div>
      </div>
    </div>
  );
};
