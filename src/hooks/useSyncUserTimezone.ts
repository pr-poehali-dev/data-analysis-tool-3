import { useEffect } from "react";
import { authStore } from "@/store/authStore";
import { getBrowserTimezone } from "@/lib/userTimezone";
import funcUrls from "../../backend/func2url.json";

const PROFILE_URL = (funcUrls as Record<string, string>)["profile-update"];
const SENT_KEY = "user_tz_sent";

export function useSyncUserTimezone(isLoggedIn: boolean) {
  useEffect(() => {
    if (!isLoggedIn || !PROFILE_URL) return;

    const timezone = getBrowserTimezone();
    if (!timezone) return;

    const token = authStore.getAccessToken();
    if (!token) return;

    try {
      if (sessionStorage.getItem(SENT_KEY) === timezone) return;
    } catch {
      return;
    }

    fetch(`${PROFILE_URL}?action=set_timezone`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ timezone }),
    })
      .then((res) => {
        if (!res.ok) return;
        try {
          sessionStorage.setItem(SENT_KEY, timezone);
        } catch {
          return;
        }
      })
      .catch(() => undefined);
  }, [isLoggedIn]);
}
