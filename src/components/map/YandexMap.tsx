import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";

interface YandexMapProps {
  onAddressSelect?: (address: string, coordinates: [number, number]) => void;
  initialAddress?: string;
  height?: string;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

export const YandexMap = ({ onAddressSelect, initialAddress = "", height = "300px" }: YandexMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [placemark, setPlacemark] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    let mapInstance: any = null;

    const initMap = () => {
      if (!window.ymaps) {
        setTimeout(initMap, 100);
        return;
      }

      window.ymaps.ready(() => {
        if (!mapRef.current) return;
        
        mapInstance = new window.ymaps.Map(mapRef.current, {
          center: [55.751574, 37.573856],
          zoom: 10,
          controls: ["zoomControl", "fullscreenControl"],
        });

        mapInstance.events.add("click", (e: any) => {
          const coords = e.get("coords");
          handleMapClick(coords, mapInstance);
        });

        setMap(mapInstance);
        setIsMapReady(true);
      });
    };

    initMap();

    return () => {
      if (mapInstance) {
        mapInstance.destroy();
      }
    };
  }, []);

  const handleMapClick = async (coords: [number, number], mapInstance?: any) => {
    const currentMap = mapInstance || map;
    if (!currentMap) return;

    if (placemark) {
      currentMap.geoObjects.remove(placemark);
    }

    const newPlacemark = new window.ymaps.Placemark(coords, {}, {
      preset: "islands#redDotIcon",
      draggable: true,
    });

    newPlacemark.events.add("dragend", () => {
      const newCoords = newPlacemark.geometry.getCoordinates();
      getAddress(newCoords);
    });

    currentMap.geoObjects.add(newPlacemark);
    setPlacemark(newPlacemark);

    getAddress(coords);
  };

  const getAddress = async (coords: [number, number]) => {
    if (!window.ymaps) return;

    try {
      const geocoder = await window.ymaps.geocode(coords);
      const firstGeoObject = geocoder.geoObjects.get(0);
      const address = firstGeoObject.getAddressLine();
      
      setSearchQuery(address);
      if (onAddressSelect) {
        onAddressSelect(address, coords);
      }
    } catch (error) {
      console.error("Error getting address:", error);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery || !map || !window.ymaps || !isMapReady) {
      console.log("Search conditions not met:", { searchQuery, map: !!map, ymaps: !!window.ymaps, isMapReady });
      return;
    }

    try {
      const geocoder = await window.ymaps.geocode(searchQuery);
      const firstGeoObject = geocoder.geoObjects.get(0);
      
      if (firstGeoObject) {
        const coords = firstGeoObject.geometry.getCoordinates();
        const address = firstGeoObject.getAddressLine();

        map.setCenter(coords, 15, {
          duration: 300,
        });

        if (placemark) {
          map.geoObjects.remove(placemark);
        }

        const newPlacemark = new window.ymaps.Placemark(coords, {}, {
          preset: "islands#redDotIcon",
          draggable: true,
        });

        newPlacemark.events.add("dragend", () => {
          const newCoords = newPlacemark.geometry.getCoordinates();
          getAddress(newCoords);
        });

        map.geoObjects.add(newPlacemark);
        setPlacemark(newPlacemark);

        setSearchQuery(address);
        if (onAddressSelect) {
          onAddressSelect(address, coords);
        }
      }
    } catch (error) {
      console.error("Error searching address:", error);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Введите адрес или кликните на карте"
            className="pl-10"
            disabled={!isMapReady}
          />
        </div>
        <button
          type="submit"
          disabled={!isMapReady || !searchQuery}
          className="px-4 py-2 bg-[#156d95] text-white rounded-md hover:bg-[#124d6b] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Найти
        </button>
      </form>

      {!isMapReady && (
        <div className="w-full rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50" style={{ height }}>
          <p className="text-gray-500">Загрузка карты...</p>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        style={{ width: "100%", height, display: isMapReady ? "block" : "none" }}
        className="rounded-lg border border-gray-200 overflow-hidden"
      />

      <p className="text-xs text-gray-500 flex items-start gap-2">
        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Кликните на карте или введите адрес в поле поиска и нажмите "Найти". Метку можно перемещать для уточнения позиции.
        </span>
      </p>
    </div>
  );
};