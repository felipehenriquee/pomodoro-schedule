import { useTranslation } from "react-i18next";
import type { TemplateInput } from "../../../models";

type DurationsPatch = Partial<
  Pick<TemplateInput, "work_min" | "short_break_min">
>;

type Props = {
  workMin: number;
  shortBreakMin: number;
  onChange: (patch: DurationsPatch) => void;
};

/** "Foco (min)" / "Pausa curta (min, opcional)". */
export function DurationsRow({ workMin, shortBreakMin, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="row">
      <label>
        {t("templateForm.focusMin")}
        <input
          type="number"
          min={1}
          value={workMin}
          onChange={(e) => onChange({ work_min: Number(e.target.value) })}
        />
      </label>
      <label>
        {t("templateForm.shortBreakMin")}
        <input
          type="number"
          min={0}
          value={shortBreakMin}
          placeholder={t("templateForm.noShortBreak")}
          onChange={(e) =>
            onChange({ short_break_min: Number(e.target.value) || 0 })
          }
        />
      </label>
    </div>
  );
}
