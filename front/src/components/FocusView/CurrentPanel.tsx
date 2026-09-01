import { TaskList } from "../TaskList";
import { KIND_LABEL } from "./labels";
import type { Block } from "../../models";

type Props = {
  cur: Block | null;
  metaText: string;
};

/**
 * Default panel: the current event's "Nº <kind> do dia" label and name, plus
 * its task list when it's a focus block.
 */
export function CurrentPanel({ cur, metaText }: Props) {
  return (
    <>
      <div className="event-meta">
        <div className="event-number">{metaText}</div>
        <div className="event-name">
          {cur ? cur.label ?? KIND_LABEL[cur.kind] : "sem evento agora"}
        </div>
      </div>

      {cur && cur.kind === "work" && (
        <TaskList dayAgendaId={cur.day_agenda_id} seq={cur.seq ?? 1} />
      )}
    </>
  );
}
