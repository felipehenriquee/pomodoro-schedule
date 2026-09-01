import { useTranslation } from "react-i18next";
import { TaskList } from "../TaskList";
import { useFocusLabels } from "./labels";
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
  const { t } = useTranslation();
  const { KIND_LABEL } = useFocusLabels();

  return (
    <>
      <div className="event-meta">
        <div className="event-number">{metaText}</div>
        <div className="event-name">
          {cur ? cur.label ?? KIND_LABEL[cur.kind] : t("focusView.noEventNow")}
        </div>
      </div>

      {cur && cur.kind === "work" && (
        <TaskList
          dayAgendaId={cur.day_agenda_id}
          seq={cur.seq ?? 1}
          templateId={cur.manual ? undefined : cur.template_id}
        />
      )}
    </>
  );
}
