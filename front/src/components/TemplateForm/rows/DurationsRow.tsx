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
  return (
    <div className="row">
      <label>
        Foco (min)
        <input
          type="number"
          min={1}
          value={workMin}
          onChange={(e) => onChange({ work_min: Number(e.target.value) })}
        />
      </label>
      <label>
        Pausa curta (min, opcional)
        <input
          type="number"
          min={0}
          value={shortBreakMin}
          placeholder="0 = sem pausa curta"
          onChange={(e) =>
            onChange({ short_break_min: Number(e.target.value) || 0 })
          }
        />
      </label>
    </div>
  );
}
