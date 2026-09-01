import { Icon } from "../../Icon";
import type { Task } from "../../../models";

type Props = {
  task: Task;
  onToggle: (done: boolean) => void;
  onEdit: () => void;
  onRemove: () => void;
};

/** Read mode: checkbox + text + edit / remove icons. */
export function TaskRowView({ task, onToggle, onEdit, onRemove }: Props) {
  return (
    <li className={task.done ? "done" : ""}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span>{task.text}</span>
      <button className="row-ico" title="editar" onClick={onEdit}>
        <Icon name="edit" size={16} />
      </button>
      <button className="row-ico" title="remover" onClick={onRemove}>
        <Icon name="delete" size={16} />
      </button>
    </li>
  );
}
