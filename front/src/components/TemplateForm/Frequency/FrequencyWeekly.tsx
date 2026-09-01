import { WEEKDAYS } from "./weekdays";
import type { Weekday } from "../../../models";

type Props = {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
};

/** freq === "weekly": pick which weekdays the schedule runs on. */
export function FrequencyWeekly({ value, onChange }: Props) {
  const toggle = (d: Weekday) =>
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d]);

  return (
    <div className="field">
      <span className="field-label">Dias da semana</span>
      <div className="days">
        {WEEKDAYS.map((d) => (
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
