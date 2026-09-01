import { useTranslation } from "react-i18next";
import { useWeekdays } from "./weekdays";
import type { Weekday } from "../../../models";

type Props = {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
};

/** freq === "weekly": pick which weekdays the schedule runs on. */
export function FrequencyWeekly({ value, onChange }: Props) {
  const { t } = useTranslation();
  const weekdays = useWeekdays();

  const toggle = (d: Weekday) =>
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d]);

  return (
    <div className="field">
      <span className="field-label">{t("templateForm.weekdaysLabel")}</span>
      <div className="days">
        {weekdays.map((d) => (
          <button
            type="button"
            key={d.key}
            className={value.includes(d.key) ? "day on" : "day"}
            onClick={() => toggle(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
