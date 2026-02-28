import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Recommendation } from "@/store/recommendationsStore";
import { recommendationsStore } from "@/store/recommendationsStore";
import PhotoLightbox from "./PhotoLightbox";

interface RecommendationPhotosProps {
  recommendation: Recommendation;
}

export default function RecommendationPhotos({ recommendation }: RecommendationPhotosProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const photoCount = recommendation.photos.length > 0 ? recommendation.photos.length : ((recommendation as Record<string, unknown>).photoCount as number) || 0;

  if (photoCount === 0 && recommendation.photos.length === 0) return null;

  const displayPhotos = recommendation.photos.length > 0 && recommendation.photos[0]?.startsWith('data:')
    ? recommendation.photos
    : photos;

  if (recommendation.photos.length > 0 && recommendation.photos[0]?.startsWith('data:')) {
    return (
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Фотографии ({recommendation.photos.length}):</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {recommendation.photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Фото ${index + 1}`}
              className="w-full h-32 sm:h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setLightboxIndex(index)}
            />
          ))}
        </div>
        <AnimatePresence>
          {lightboxIndex !== null && (
            <PhotoLightbox
              photos={recommendation.photos}
              initialIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  const loadPhotos = async () => {
    if (loaded || loading) return;
    setLoading(true);
    const full = await recommendationsStore.fetchRecommendationById(recommendation.id);
    if (full && full.photos.length > 0) {
      setPhotos(full.photos);
    }
    setLoaded(true);
    setLoading(false);
  };

  return (
    <div className="mb-4">
      {!loaded ? (
        <Button variant="outline" size="sm" onClick={loadPhotos} disabled={loading}>
          <Icon name={loading ? "Loader2" : "Image"} size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Загрузка...' : `Показать фотографии (${photoCount})`}
        </Button>
      ) : displayPhotos.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-2">Фотографии ({displayPhotos.length}):</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {displayPhotos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Фото ${index + 1}`}
                className="w-full h-32 sm:h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxIndex(index)}
              />
            ))}
          </div>
          <AnimatePresence>
            {lightboxIndex !== null && (
              <PhotoLightbox
                photos={displayPhotos}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
              />
            )}
          </AnimatePresence>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Фотографии не загружены</p>
      )}
    </div>
  );
}
