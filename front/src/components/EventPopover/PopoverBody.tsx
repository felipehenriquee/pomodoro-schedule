import { fmtFullDate, fmtHM, freqLabel } from "../../lib/time";
import type { Block } from "../../models";

type Props = {
  block: Block;
  cancelled: boolean;
};

/** Popover body: full date, time range, and frequency (or "Cancelado"). */
export function PopoverBody({ block, cancelled }: Props) {
  return (
    <div className="event-popover-body">
      <div className="epr">{fmtFullDate(block.start_ts)}</div>
      <div className="epr">
        {fmtHM(block.start_ts)} &ndash; {fmtHM(block.end_ts)}
      </div>
      <div className="epr epr-dim">
        {cancelled
          ? "Cancelado"
          : freqLabel(block.freq, block.days_of_week, block.interval_days)}
      </div>
    </div>
  );
}
