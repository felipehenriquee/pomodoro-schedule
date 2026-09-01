import { useTranslation } from "react-i18next";
import type { BlockKind } from "../../models";

export type KindOption = { key: BlockKind; label: string; min: number };

// Default duration (minutes) per kind -- not translatable data, so it stays
// a plain constant; only the label needs t().
const MIN: Record<BlockKind, number> = {
  work: 50,
  short_break: 10,
  long_break: 60,
};

/** Selectable event kinds, with translated labels + their default duration. */
export function useKinds(): KindOption[] {
  const { t } = useTranslation();
  return [
    { key: "work", label: t("common.kind.work"), min: MIN.work },
    {
      key: "short_break",
      label: t("common.kind.shortBreak"),
      min: MIN.short_break,
    },
    {
      key: "long_break",
      label: t("common.kind.longBreak"),
      min: MIN.long_break,
    },
  ];
}
