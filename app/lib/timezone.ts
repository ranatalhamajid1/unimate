/**
 * Reusable Asia/Karachi (PKT, UTC+5) timezone helpers.
 * UniMate stores all timestamps in PostgreSQL as UTC, but interprets
 * daily calendars, week boundaries, and schedules in the student's local timezone (Asia/Karachi).
 */

export const PKT_OFFSET_HOURS = 5;
export const PKT_OFFSET_MS = PKT_OFFSET_HOURS * 60 * 60 * 1000;

export type PKTDateParts = {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  day: number; // 1-31
  dayOfWeek: number; // 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
  hours: number; // 0-23
  minutes: number; // 0-59
  dateString: string; // YYYY-MM-DD
};

/**
 * Extracts wall-clock date/time components for a given instant in Asia/Karachi.
 */
export function getPKTDateParts(date: Date | string | number): PKTDateParts {
  const d = new Date(date);
  const pktMs = d.getTime() + PKT_OFFSET_MS;
  const pkt = new Date(pktMs);

  const year = pkt.getUTCFullYear();
  const month = pkt.getUTCMonth();
  const day = pkt.getUTCDate();
  const utcDay = pkt.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const dayOfWeek = utcDay === 0 ? 7 : utcDay; // 1 = Monday ... 7 = Sunday
  const hours = pkt.getUTCHours();
  const minutes = pkt.getUTCMinutes();

  const monthStr = String(month + 1).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  const dateString = `${year}-${monthStr}-${dayStr}`;

  return { year, month, day, dayOfWeek, hours, minutes, dateString };
}

/**
 * Returns UTC Date boundaries for a specific day in Asia/Karachi.
 */
export function getPKTDayBounds(date: Date | string | number = new Date()): {
  start: Date;
  end: Date;
} {
  const pkt = getPKTDateParts(date);
  // Midnight 00:00:00.000 PKT in UTC
  const startMs = Date.UTC(pkt.year, pkt.month, pkt.day, 0, 0, 0, 0) - PKT_OFFSET_MS;
  // End of day 23:59:59.999 PKT in UTC
  const endMs = Date.UTC(pkt.year, pkt.month, pkt.day, 23, 59, 59, 999) - PKT_OFFSET_MS;

  return {
    start: new Date(startMs),
    end: new Date(endMs),
  };
}

/**
 * Returns UTC Date boundaries for the current week (Monday 00:00:00 PKT to Sunday 23:59:59.999 PKT).
 */
export function getPKTWeekBounds(date: Date | string | number = new Date()): {
  start: Date;
  end: Date;
} {
  const pkt = getPKTDateParts(date);
  // dayOfWeek: 1 = Mon ... 7 = Sun
  const daysFromMonday = pkt.dayOfWeek - 1;

  // Monday 00:00:00 PKT in UTC
  const startMs =
    Date.UTC(pkt.year, pkt.month, pkt.day - daysFromMonday, 0, 0, 0, 0) - PKT_OFFSET_MS;
  // Sunday 23:59:59.999 PKT in UTC
  const endMs =
    Date.UTC(pkt.year, pkt.month, pkt.day - daysFromMonday + 6, 23, 59, 59, 999) - PKT_OFFSET_MS;

  return {
    start: new Date(startMs),
    end: new Date(endMs),
  };
}

/**
 * Returns UTC Date boundaries for the current month in Asia/Karachi.
 */
export function getPKTMonthBounds(date: Date | string | number = new Date()): {
  start: Date;
  end: Date;
} {
  const pkt = getPKTDateParts(date);
  // 1st of month 00:00:00 PKT in UTC
  const startMs = Date.UTC(pkt.year, pkt.month, 1, 0, 0, 0, 0) - PKT_OFFSET_MS;
  // Last millisecond of month in PKT
  const endMs = Date.UTC(pkt.year, pkt.month + 1, 0, 23, 59, 59, 999) - PKT_OFFSET_MS;

  return {
    start: new Date(startMs),
    end: new Date(endMs),
  };
}

/**
 * Formats a Date object into human-readable PKT date string.
 * e.g. "Mon, Sep 6, 2026"
 */
export function formatPKTDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    timeZone: "Asia/Karachi",
    ...options,
  });
}

/**
 * Formats a Date object into human-readable PKT time string.
 * e.g. "02:30 PM"
 */
export function formatPKTTime(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    timeZone: "Asia/Karachi",
    hour: "2-digit",
    minute: "2-digit",
  });
}
