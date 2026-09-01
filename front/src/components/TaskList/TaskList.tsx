import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTasks } from "../../hooks/useTasks";
import { TasksHead } from "./TasksHead";
import { TaskForm } from "./TaskForm";
import { TaskRow } from "./TaskRow";

type Props = {
  dayAgendaId: number;
  seq: number;
  /** When set, rows offer "propagate to every focus at this position". */
  templateId?: number;
};

export function TaskList({ dayAgendaId, seq, templateId }: Props) {
  const { t } = useTranslation();
  const { tasks, add, update, toggle, remove, propagate } = useTasks(
    dayAgendaId,
    seq,
    templateId
  );
  const [open, setOpen] = useState(false);

  async function handleAdd(text: string) {
    await add(text);
    setOpen(false);
  }

  return (
    <div className="tasks">
      <TasksHead open={open} onToggle={() => setOpen((o) => !o)} />

      {open && <TaskForm onAdd={handleAdd} />}

      {tasks.length > 0 ? (
        <ul>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={(done) => toggle(task.id, done)}
              onSave={(txt) => update(task.id, txt)}
              onRemove={() => remove(task.id)}
              onPropagate={
                propagate ? () => propagate(task.text) : undefined
              }
            />
          ))}
        </ul>
      ) : (
        !open && <p className="tasks-empty">{t("tasks.empty")}</p>
      )}
    </div>
  );
}
