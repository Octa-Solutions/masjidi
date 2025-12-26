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
   * Returns day index ∈ [0, 365]
   * always according to leap year
   * @param {Date} date
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
  static stdTimezoneOffset(date: Date) {
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  }
  static getDaylightSavingTimeOffset(date: Date) {
    return this.stdTimezoneOffset(date) - date.getTimezoneOffset();
  }

  static getWeekOfMonth(date: Date) {
    const day = date.getDay();
    const dayOfWeek = date.getDate() - day + (day === 0 ? -6 : 1);
    return Math.floor((dayOfWeek + 10) / 7);
  }
}
