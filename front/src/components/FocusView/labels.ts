import { useTranslation } from "react-i18next";
import type { BlockKind } from "../../models";

/** Big mode-button labels ("Pomodoro", "Descanso curto", "Descanso longo") and
 * the lowercase form used in "2º foco do dia", "3º descanso curto do dia". */
export function useFocusLabels() {
  const { t } = useTranslation();

  const KIND_LABEL: Record<BlockKind, string> = {
    work: t("focusView.mode.work"),
    short_break: t("focusView.mode.shortBreak"),
    long_break: t("focusView.mode.longBreak"),
  };

  const NTH_LABEL: Record<BlockKind, string> = {
    work: t("focusView.nth.work"),
    short_break: t("focusView.nth.shortBreak"),
    long_break: t("focusView.nth.longBreak"),
  };

  return { KIND_LABEL, NTH_LABEL };
}
