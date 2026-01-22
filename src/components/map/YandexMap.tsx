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
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const initMap = () => {
      if (!window.ymaps) {
        console.log("Waiting for ymaps to load...");
        setTimeout(initMap, 200);
        return;
      }

      window.ymaps.ready(() => {
        if (!mapRef.current || mapInstanceRef.current) return;
        
        console.log("Initializing Yandex Map...");
        
        try {
          const map = new window.ymaps.Map(mapRef.current, {
            center: [55.751574, 37.573856],
            zoom: 10,
            controls: ["zoomControl", "fullscreenControl", "geolocationControl"],
          });

          map.events.add("click", (e: any) => {
            const coords = e.get("coords");
            handleMapClick(coords);
          });

          mapInstanceRef.current = map;
          setIsMapReady(true);
          console.log("Map initialized successfully");
        } catch (error) {
          console.error("Error initializing map:", error);
        }
      });
    };

    const timer = setTimeout(initMap, 1500);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleMapClick = (coords: [number, number]) => {
    if (!mapInstanceRef.current || !window.ymaps) return;

    if (placemarkRef.current) {
      mapInstanceRef.current.geoObjects.remove(placemarkRef.current);
    }

    const newPlacemark = new window.ymaps.Placemark(coords, {}, {
      preset: "islands#redDotIcon",
      draggable: true,
    });

    newPlacemark.events.add("dragend", () => {
      const newCoords = newPlacemark.geometry.getCoordinates();
      getAddressFromCoords(newCoords);
    });

    mapInstanceRef.current.geoObjects.add(newPlacemark);
    placemarkRef.current = newPlacemark;

    getAddressFromCoords(coords);
  };

  const getAddressFromCoords = (coords: [number, number]) => {
    if (!window.ymaps) return;

    window.ymaps.geocode(coords).then((res: any) => {
      const firstGeoObject = res.geoObjects.get(0);
      if (firstGeoObject) {
        const address = firstGeoObject.getAddressLine();
        setSearchQuery(address);
        if (onAddressSelect) {
          onAddressSelect(address, coords);
        }
      }
    }).catch((error: any) => {
      console.error("Error getting address:", error);
    });
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery.trim() || !mapInstanceRef.current || !window.ymaps || !isMapReady) {
      return;
    }

    setIsSearching(true);

    try {
      const res = await window.ymaps.geocode(searchQuery);
      const firstGeoObject = res.geoObjects.get(0);
      
      if (firstGeoObject) {
        const coords = firstGeoObject.geometry.getCoordinates();
        const address = firstGeoObject.getAddressLine();

        mapInstanceRef.current.setCenter(coords, 15, {
          duration: 300,
        });

        if (placemarkRef.current) {
          mapInstanceRef.current.geoObjects.remove(placemarkRef.current);
        }

        const newPlacemark = new window.ymaps.Placemark(coords, {}, {
          preset: "islands#redDotIcon",
          draggable: true,
        });

        newPlacemark.events.add("dragend", () => {
          const newCoords = newPlacemark.geometry.getCoordinates();
          getAddressFromCoords(newCoords);
        });

        mapInstanceRef.current.geoObjects.add(newPlacemark);
        placemarkRef.current = newPlacemark;

        setSearchQuery(address);
        if (onAddressSelect) {
          onAddressSelect(address, coords);
        }
      }
    } catch (error) {
      console.error("Error searching address:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
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
          disabled={!isMapReady || !searchQuery.trim() || isSearching}
          className="px-4 py-2 bg-[#156d95] text-white rounded-md hover:bg-[#124d6b] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isSearching ? "Поиск..." : "Найти"}
        </button>
      </form>

      {!isMapReady && (
        <div 
          className="w-full rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50" 
          style={{ height }}
        >
          <p className="text-gray-500">Загрузка карты...</p>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        style={{ 
          width: "100%", 
          height, 
          display: isMapReady ? "block" : "none" 
        }}
        className="rounded-lg border border-gray-200 overflow-hidden"
      />

      <p className="text-xs text-gray-500 flex items-start gap-2">
        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Введите адрес и нажмите "Найти" или кликните на карте. Метку можно перемещать для уточнения позиции.
        </span>
      </p>
    </div>
  );
};