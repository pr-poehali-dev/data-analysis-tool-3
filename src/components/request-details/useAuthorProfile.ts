import { useState } from "react";
import type { UserProfile, Review } from "@/components/offers/UserProfileDialog";
import funcUrls from "../../../backend/func2url.json";

interface ReviewsData {
  reviews: Review[];
  avg_rating: number | null;
  total: number;
}

const emptyReviews: ReviewsData = { reviews: [], avg_rating: null, total: 0 };

export function useAuthorProfile() {
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileReviews, setProfileReviews] = useState<ReviewsData>(emptyReviews);

  const openProfile = async (params: {
    email: string;
    name: string;
    avatar?: string;
    city?: string;
  }) => {
    const { email, name, avatar, city } = params;
    const PROFILE_API = (funcUrls as Record<string, string>)["profile-update"];
    const REVIEWS_API = (funcUrls as Record<string, string>)["reviews"];

    const fallback: UserProfile = {
      firstName: name.split(' ')[0] || '',
      lastName: name.split(' ').slice(1).join(' ') || '',
      avatar_url: avatar,
      city: city || '',
      vkLink: '',
      role: 'tenant',
      email,
    };

    setSelectedProfile(fallback);
    setProfileDialogOpen(true);

    try {
      const [profileRes, reviewsRes] = await Promise.all([
        fetch(`${PROFILE_API}?email=${encodeURIComponent(email)}`),
        fetch(`${REVIEWS_API}?reviewee_email=${encodeURIComponent(email)}`),
      ]);
      const profileData = await profileRes.json();
      const reviewsData = await reviewsRes.json();

      if (profileData.user) {
        setSelectedProfile({ ...profileData.user, avatar_url: profileData.user.avatar_url || avatar });
      }
      setProfileReviews({
        reviews: reviewsData.reviews || [],
        avg_rating: reviewsData.avg_rating,
        total: reviewsData.total || 0,
      });
    } catch {
      setProfileReviews(emptyReviews);
    }
  };

  return {
    profileDialogOpen,
    setProfileDialogOpen,
    selectedProfile,
    profileReviews,
    openProfile,
  };
}
