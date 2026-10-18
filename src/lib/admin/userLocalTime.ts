function partsOf(date: Date, timeZone?: string) {
  const fmt = new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const get = (type: string) => fmt.formatToParts(date).find((p) => p.type === type)?.value ?? "";
  return { day: get("day"), month: get("month"), hour: get("hour"), minute: get("minute") };
}

function placeName(date: Date, timeZone: string): string {
  const name =
    new Intl.DateTimeFormat("ru-RU", { timeZone, timeZoneName: "shortGeneric" })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  if (name && !/^(GMT|UTC)/.test(name)) return name;
  return timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
}

export function userLocalTimeHint(iso: string | null | undefined, userTz: string | null | undefined): string | null {
  if (!iso || !userTz) return null;
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;

    const admin = partsOf(date);
    const user = partsOf(date, userTz);
    const same =
      admin.day === user.day && admin.month === user.month && admin.hour === user.hour && admin.minute === user.minute;
    if (same) return null;

    const time = `${user.hour}:${user.minute}`;
    const when = admin.day === user.day && admin.month === user.month ? time : `${user.day}.${user.month}, ${time}`;
    return `${when} (${placeName(date, userTz)})`;
  } catch {
    return null;
  }
}
