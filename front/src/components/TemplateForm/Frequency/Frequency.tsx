import { useTranslation } from "react-i18next";
import { useFreqOptions } from "./options";
import { FrequencyWeekly } from "./FrequencyWeekly";
import { FrequencyOnce } from "./FrequencyOnce";
import { FrequencyInterval } from "./FrequencyInterval";
import { isoDate } from "../../../lib/time";
import type { Freq, TemplateInput, Weekday } from "../../../models";

type FreqPatch = Partial<
  Pick<TemplateInput, "freq" | "days_of_week" | "anchor_date" | "interval_days">
>;

type Props = {
  freq: Freq;
  daysOfWeek: Weekday[];
  anchorDate: string | null;
  intervalDays: number | null;
  today: string;
  onChange: (patch: FreqPatch) => void;
};

/** The "Frequência" select + the sub-panel for the chosen frequency type. */
export function Frequency({
  freq,
  daysOfWeek,
  anchorDate,
  intervalDays,
  today,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const freqOptions = useFreqOptions();

  function selectFreq(next: Freq) {
    onChange({
      freq: next,
      anchor_date:
        next === "once" || next === "interval"
          ? anchorDate ?? isoDate(new Date())
          : null,
      interval_days: next === "interval" ? intervalDays ?? 2 : null,
    });
  }

  return (
    <>
      <label>
        {t("templateForm.frequency")}
        <select
          value={freq}
          onChange={(e) => selectFreq(e.target.value as Freq)}
        >
          {freqOptions.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      {freq === "weekly" && (
        <FrequencyWeekly
          value={daysOfWeek}
          onChange={(days) => onChange({ days_of_week: days })}
        />
      )}

      {freq === "once" && (
        <FrequencyOnce
          value={anchorDate}
          min={today}
          onChange={(d) => onChange({ anchor_date: d })}
        />
      )}

      {freq === "interval" && (
        <FrequencyInterval
          intervalDays={intervalDays}
          anchorDate={anchorDate}
          min={today}
          onChangeInterval={(n) => onChange({ interval_days: n })}
          onChangeAnchor={(d) => onChange({ anchor_date: d })}
        />
      )}
    </>
  );
}
