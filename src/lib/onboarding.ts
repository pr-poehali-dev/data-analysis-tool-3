/**
 * Учёт показов онбординг-тура по нижнему меню личного кабинета.
 * Тур показывается только первые несколько входов пользователя в личный кабинет
 * (на мобильной версии), после чего перестаёт появляться сам собой.
 */

const STORAGE_PREFIX = "sovetpay_onboarding_visits_";

export const MAX_ONBOARDING_TOUR_VISITS = 3;

function getStorageKey(email: string): string {
  return `${STORAGE_PREFIX}${email}`;
}

/** Увеличивает счётчик входов на мобильной версии личного кабинета и возвращает новое значение. */
export function registerOnboardingVisit(email: string): number {
  if (!email) return MAX_ONBOARDING_TOUR_VISITS + 1;

  const key = getStorageKey(email);
  let count = 0;
  try {
    const raw = localStorage.getItem(key);
    count = raw ? parseInt(raw, 10) : 0;
    if (Number.isNaN(count)) count = 0;
  } catch {
    return MAX_ONBOARDING_TOUR_VISITS + 1;
  }

  const next = count + 1;
  try {
    localStorage.setItem(key, String(next));
  } catch {
    // localStorage недоступен/переполнен — тур просто не будет показан повторно, это не критично
  }
  return next;
}
