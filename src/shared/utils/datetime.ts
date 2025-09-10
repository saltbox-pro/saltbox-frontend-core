import dayjs, { ConfigType } from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/ru";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { AppLanguage, DAYJS_LOCALE_MAP } from "@saltbox/saltbox-frontend-common";

dayjs.extend(relativeTime);
dayjs.extend(timezone);
dayjs.extend(utc);

export const DATETIME_FORMAT_FULL = "DD.MM.YYYY HH:mm:ss";
export const DATETIME_TIMESTAMP = "YYYY-MM-DD HH:mm:ss";

export function pastTimeByUserTZ(compared: ConfigType): string {
  return dayjs(dayjs.utc(compared))
    .tz(Intl.DateTimeFormat().resolvedOptions().timeZone)
    .from(dayjs().tz(Intl.DateTimeFormat().resolvedOptions().timeZone));
}

export function formatTimeByUserTZ(
  date: ConfigType,
  templateFormat: string = DATETIME_FORMAT_FULL
): string {
  return dayjs(date)
    .tz(Intl.DateTimeFormat().resolvedOptions().timeZone)
    .format(templateFormat);
}

export function setDateTimeLocale(locale: AppLanguage) {
  dayjs.locale(DAYJS_LOCALE_MAP[locale]);
}
