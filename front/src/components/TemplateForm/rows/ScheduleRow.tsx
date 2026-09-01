import type { TemplateInput } from "../../../models";

type SchedulePatch = Partial<Pick<TemplateInput, "start_time" | "end_time">>;

type Props = {
  startTime: string;
  endTime: string;
  onChange: (patch: SchedulePatch) => void;
};

/** Day window: "Início" / "Fim". */
export function ScheduleRow({ startTime, endTime, onChange }: Props) {
  return (
    <div className="row">
      <label>
        Início
        <input
          type="time"
          value={startTime}
          onChange={(e) => onChange({ start_time: e.target.value })}
        />
      </label>
      <label>
        Fim
        <input
          type="time"
          value={endTime}
          onChange={(e) => onChange({ end_time: e.target.value })}
        />
      </label>
    </div>
  );
}
