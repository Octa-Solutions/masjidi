export interface AlAdhanAPIOptions {
  latitude?: number;
  longitude?: number;

  calculationMethod?: AlAdhanAPICalculationMethod;
  /**
   * Which Shafaq to use if the 'method' query parameter is MOONSIGHTING_COMMITTEE_WORLDWIDE
   */
  shafaq?: AlAdhanAPIShafaq;
  school?: AlAdhanAPISchool;

  /**
   * Offset timings returned by the API in minutes for each prayer.
   * See https://aladhan.com/calculation-methods for more details.
   */
  tune?: {
    Imsak?: number;
    Fajr?: number;
    Sunrise?: number;
    Dhuhr?: number;
    Asr?: number;
    Maghrib?: number;
    Sunset?: number;
    Isha?: number;
    Midnight?: number;
  };

  /**
   * A valid timezone name as specified on https://php.net/manual/en/timezones.php.
   * If you do not specify this, it's calculated using the co-ordinates provided.
   */
  timezonestring?: string;

  iso8601?: boolean;
}

export const AlAdhanAPICalculationMethod = {
  JAFARI_SHIA_ITHNA_ASHARI: 0,
  UNIVERSITY_OF_ISLAMIC_SCIENCES_KARACHI: 1,
  ISLAMIC_SOCIETY_OF_NORTH_AMERICA: 2,
  MUSLIM_WORLD_LEAGUE: 3,
  UMM_AL_QURA_UNIVERSITY_MAKKAH: 4,
  EGYPTIAN_GENERAL_AUTHORITY_OF_SURVEY: 5,
  INSTITUTE_OF_GEOPHYSICS_UNIVERSITY_OF_TEHRAN: 7,
  GULF_REGION: 8,
  KUWAIT: 9,
  QATAR: 10,
  MAJLIS_UGAMA_ISLAM_SINGAPURA_SINGAPORE: 11,
  UNION_ORGANIZATION_ISLAMIC_DE_FRANCE: 12,
  DIYANET_İŞLERI_BAŞKANLIĞI_TURKEY: 13,
  SPIRITUAL_ADMINISTRATION_OF_MUSLIMS_OF_RUSSIA: 14,
  MOONSIGHTING_COMMITTEE_WORLDWIDE: 15,
  DUBAI: 16,
  JABATAN_KEMAJUAN_ISLAM_MALAYSIA_JAKIM: 17,
  TUNISIA: 18,
  ALGERIA: 19,
  KEMENAG_KEMENTERIAN_AGAMA_REPUBLIK_INDONESIA: 20,
  MOROCCO: 21,
  COMUNIDADE_ISLAMICA_DE_LISBOA: 22,
  MINISTRY_OF_AWQAF_ISLAMIC_AFFAIRS_AND_HOLY_PLACES_JORDAN: 23,

  /**
   * See https://aladhan.com/calculation-methods
   */
  CUSTOM: 99,
} as const;

export type AlAdhanAPICalculationMethod =
  (typeof AlAdhanAPICalculationMethod)[keyof typeof AlAdhanAPICalculationMethod];

export const AlAdhanAPIShafaq = {
  /** General */
  GENERAL: "general",
  /** Red */
  AHMER: "ahmer",
  /** White */
  ABYAD: "abyad",
} as const;

export type AlAdhanAPIShafaq =
  (typeof AlAdhanAPIShafaq)[keyof typeof AlAdhanAPIShafaq];

export const AlAdhanAPISchool = {
  STANDARD: 0,
  HANAFI: 1,
};

export type AlAdhanAPISchool =
  (typeof AlAdhanAPISchool)[keyof typeof AlAdhanAPISchool];
