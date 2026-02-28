import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar_url: string;
  city: string;
  vkLink: string;
  role: string;
  email: string;
}

export interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile | null;
  reviews: {
    reviews: Review[];
    avg_rating: number | null;
    total: number;
  };
}

export default function UserProfileDialog({ open, onOpenChange, profile, reviews }: UserProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">Профиль пользователя</DialogTitle>
        {profile && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <img
                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="w-16 h-16 rounded-full"
              />
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {profile.firstName} {profile.lastName}
                </h3>
                {profile.city && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Icon name="MapPin" size={14} />
                    {profile.city}
                  </p>
                )}
              </div>
            </div>

            {profile.vkLink && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Социальные сети</p>
                <a
                  href={profile.vkLink.startsWith('http') ? profile.vkLink : `https://vk.com/${profile.vkLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Icon name="ExternalLink" size={14} />
                  ВКонтакте
                </a>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-foreground mb-3">Рейтинг и отзывы</p>
              {reviews.total > 0 ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Icon
                          key={star}
                          name="Star"
                          size={18}
                          className={star <= Math.round(reviews.avg_rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold">{reviews.avg_rating?.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({reviews.total} отзывов)</span>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {reviews.reviews.map(review => (
                      <div key={review.id} className="border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{review.reviewer_name}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Icon
                                key={star}
                                name="Star"
                                size={12}
                                className={star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(review.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Пока нет отзывов</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
