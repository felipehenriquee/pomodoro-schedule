import { useTranslation } from "react-i18next";

type Props = {
  intervalDays: number | null;
  anchorDate: string | null;
  min: string;
  onChangeInterval: (days: number) => void;
  onChangeAnchor: (date: string | null) => void;
};

/** freq === "interval": every N days starting from a date. */
export function FrequencyInterval({
  intervalDays,
  anchorDate,
  min,
  onChangeInterval,
  onChangeAnchor,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="row">
      <label>
        {t("templateForm.everyDays")}
        <input
          type="number"
          min={1}
          value={intervalDays ?? 2}
          onChange={(e) => onChangeInterval(Number(e.target.value))}
        />
      </label>
      <label>
        {t("templateForm.from")}
        <input
          type="date"
          min={min}
          value={anchorDate ?? ""}
          onChange={(e) => onChangeAnchor(e.target.value || null)}
        />
      </label>
    </div>
  );
}
