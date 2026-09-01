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
  return (
    <div className="row">
      <label>
        A cada (dias)
        <input
          type="number"
          min={1}
          value={intervalDays ?? 2}
          onChange={(e) => onChangeInterval(Number(e.target.value))}
        />
      </label>
      <label>
        A partir de
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
