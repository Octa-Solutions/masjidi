/**
 * A utility class for date-related operations.
 */
export class DateUtils {
  static DAY_IN_HOURS = 24;
  static DAY_IN_MINUTES = 24 * 60;
  static DAY_IN_SECONDS = 24 * 60 * 60;

  // prettier-ignore
  static readonly LEAD_MONTHS_DAYS = [
    31, 29, 31,
    30, 31, 30,
    31, 31, 30,
    31, 30, 31,
  ] as const;

  /**
   * Returns the day index (0-365) for a given date, accounting for leap years.
   *
   * @param date - The date to calculate the day index for.
   * @returns The day index, where 0 is January 1st.
   */
  static getDayIndex(date: Date) {
    const month = date.getMonth();
    const dayOfMonth = date.getDate();
    let dayOfYear = 0;
    for (let i = 0; i < month; i++) {
      dayOfYear += DateUtils.LEAD_MONTHS_DAYS[i];
    }
    dayOfYear += dayOfMonth;
    return dayOfYear - 1;
  }

  /**
   * Calculates the standard timezone offset for a given date.
   * It compares the timezone offset of January 1st and July 1st to determine the standard offset.
   *
   * @param date - The date to calculate the offset for.
   * @returns The standard timezone offset in minutes.
   */
  static stdTimezoneOffset(date: Date) {
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  }

  /**
   * Calculates the daylight saving time offset for a given date.
   *
   * @param date - The date to calculate the offset for.
   * @returns The daylight saving time offset in minutes.
   */
  static getDaylightSavingTimeOffset(date: Date) {
    return this.stdTimezoneOffset(date) - date.getTimezoneOffset();
  }

  /**
   * Calculates the week of the month for a given date.
   *
   * @param date - The date to calculate the week of the month for.
   * @returns The week of the month (1-indexed).
   */
  static getWeekOfMonth(date: Date) {
    const day = date.getDay();
    const dayOfWeek = date.getDate() - day + (day === 0 ? -6 : 1);
    return Math.floor((dayOfWeek + 10) / 7);
  }
}
