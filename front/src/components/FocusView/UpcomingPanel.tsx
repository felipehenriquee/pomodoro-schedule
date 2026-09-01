import { fmtWhen } from "../../lib/time";
import { TaskList } from "../TaskList";
import { KIND_LABEL, NTH_LABEL } from "./labels";
import type { Block, BlockKind } from "../../models";

type Props = {
  picked: BlockKind;
  upcoming: Block | null;
};

/**
 * Shown when the user picked a mode that isn't running right now: the next
 * event of that kind (any day), plus its task list when it's a focus block.
 */
export function UpcomingPanel({ picked, upcoming }: Props) {
  return (
    <>
      <div className="event-meta">
        <div className="event-number">
          {upcoming
            ? `em breve · ${upcoming.seq ?? 1}º ${NTH_LABEL[picked]} do dia`
            : `sem ${NTH_LABEL[picked]} restante`}
        </div>
        <div className="event-name">
          {upcoming ? upcoming.label ?? KIND_LABEL[picked] : "—"}
        </div>
        {upcoming && (
          <div className="event-when">{fmtWhen(upcoming.start_ts)}</div>
        )}
      </div>

      {picked === "work" && upcoming && (
        <TaskList dayAgendaId={upcoming.day_agenda_id} seq={upcoming.seq ?? 1} />
      )}
    </>
  );
}
