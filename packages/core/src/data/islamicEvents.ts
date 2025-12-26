import { MasjidiMultiDateCondition } from "@/MasjidiDate";

export type IslamicEvent = keyof typeof islamicEvents;
export const islamicEvents = {
  FIRST_MONDAY_RAJAB: {
    when: { hijri: { month: 7, dayOfWeek: 2, weekOfMonth: 1 } },
  },
  MONDAY_THURSDAY: [
    {
      when: { hijri: { month: 7, dayOfWeek: 2 } },
    },
    {
      when: { hijri: { month: 7, dayOfWeek: 5 } },
    },
  ],
  NEW_YEAR: {
    when: { hijri: { month: 1, dayOfMonth: 1 } },
  },
  ASHURA: {
    when: { hijri: { month: 1, dayOfMonth: 10 } },
  },
  PROPHET_BIRTHDAY: {
    when: { hijri: { month: 3, dayOfMonth: 12 } },
  },
  ISRA_AND_MIRAJ: {
    when: { hijri: { month: 7, dayOfMonth: 27 } },
  },
  BATTLE_OF_BADR: {
    when: { hijri: { month: 9, dayOfMonth: 17 } },
  },
  FATH_MECCA: {
    when: { hijri: { month: 9, dayOfMonth: 20 } },
  },
  QADR: {
    when: { hijri: { month: 9, dayOfMonth: 27 } },
  },
  ARAFAH: {
    when: { hijri: { month: 12, dayOfMonth: 9 } },
  },
  HAJJ: {
    when: { hijri: { dayOfMonth: 8, month: 12 } },
  },
  WHITE_DAYS: {
    start: { hijri: { dayOfMonth: 13 } },
    end: { hijri: { dayOfMonth: 15 } },
  },
  LAST_10_DAYS_RAMADAN: {
    start: { hijri: { month: 9, dayOfMonth: 20 } },
    end: { hijri: { month: 9, dayOfMonth: 30 } },
  },
  FIRST_10_DAYS_ZULHIJAH: {
    start: { hijri: { month: 12, dayOfMonth: 1 } },
    end: { hijri: { month: 12, dayOfMonth: 10 } },
  },
  EID_FITR: {
    start: { hijri: { month: 10, dayOfMonth: 1 } },
    end: { hijri: { month: 10, dayOfMonth: 3 } },
  },
  EID_ADHA: {
    start: { hijri: { dayOfMonth: 10, month: 12 } },
    end: { hijri: { dayOfMonth: 13, month: 12 } },
  },
  TASHRIQ: {
    start: { hijri: { month: 12, dayOfMonth: 11 } },
    end: { hijri: { month: 12, dayOfMonth: 13 } },
  },
  RAMADAN: {
    when: { hijri: { month: 9 } },
  },
} as const satisfies Record<
  string,
  MasjidiMultiDateCondition | MasjidiMultiDateCondition[]
>;
