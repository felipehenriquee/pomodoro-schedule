import { useTranslation } from "react-i18next";
import type { Weekday } from "../../../models";

const KEYS: Weekday[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

/** The weekday buttons, with translated short labels ("Seg", "Ter", ...). */
export function useWeekdays(): { key: Weekday; label: string }[] {
  const { t } = useTranslation();
  return KEYS.map((key) => ({ key, label: t(`templateForm.weekday.${key}`) }));
}
