import { useTranslation } from "react-i18next";
import type { Freq } from "../../../models";

/** The frequency options for the select, with translated labels. */
export function useFreqOptions(): { key: Freq; label: string }[] {
  const { t } = useTranslation();
  return [
    { key: "once", label: t("templateForm.freq.once") },
    { key: "daily", label: t("templateForm.freq.daily") },
    { key: "weekly", label: t("templateForm.freq.weekly") },
    { key: "interval", label: t("templateForm.freq.interval") },
  ];
}
