const STORAGE_PREFIX = "sovetpay_onboarding_views_";
export const ONBOARDING_MAX_VIEWS = 3;

const getKey = (userEmail: string) => `${STORAGE_PREFIX}${userEmail}`;

export const getOnboardingViewCount = (userEmail: string): number => {
  if (!userEmail) return 0;
  const raw = localStorage.getItem(getKey(userEmail));
  const count = raw ? parseInt(raw, 10) : 0;
  return Number.isNaN(count) ? 0 : count;
};

export const shouldShowOnboardingTour = (userEmail: string): boolean => {
  return getOnboardingViewCount(userEmail) < ONBOARDING_MAX_VIEWS;
};

export const incrementOnboardingViewCount = (userEmail: string): void => {
  if (!userEmail) return;
  const next = getOnboardingViewCount(userEmail) + 1;
  localStorage.setItem(getKey(userEmail), String(next));
};

export const resetOnboardingViewCount = (userEmail: string): void => {
  if (!userEmail) return;
  localStorage.removeItem(getKey(userEmail));
};
