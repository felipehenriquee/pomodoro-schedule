import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../Icon";
import type { Task } from "../../../models";

type Props = {
  task: Task;
  onToggle: (done: boolean) => void;
  onEdit: () => void;
  onRemove: () => void;
  onPropagate?: () => void | Promise<void>;
};

/** Read mode: checkbox + text + propagate / edit / remove icons. */
export function TaskRowView({
  task,
  onToggle,
  onEdit,
  onRemove,
  onPropagate,
}: Props) {
  const { t } = useTranslation();
  const [propagating, setPropagating] = useState(false);

  async function propagate() {
    if (!onPropagate || propagating) return;
    setPropagating(true);
    try {
      await onPropagate();
    } finally {
      setPropagating(false);
    }
  }

  return (
    <li className={task.done ? "done" : ""}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span>{task.text}</span>
      {onPropagate && (
        <button
          className="row-ico"
          title={t("tasks.propagate")}
          disabled={propagating}
          onClick={propagate}
        >
          <Icon name="content_copy" size={16} />
        </button>
      )}
      <button className="row-ico" title={t("tasks.edit")} onClick={onEdit}>
        <Icon name="edit" size={16} />
      </button>
      <button className="row-ico" title={t("tasks.remove")} onClick={onRemove}>
        <Icon name="delete" size={16} />
      </button>
    </li>
  );
}
