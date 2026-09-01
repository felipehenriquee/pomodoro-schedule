import { useState } from "react";
import { useTasks } from "../../hooks/useTasks";
import { TasksHead } from "./TasksHead";
import { TaskForm } from "./TaskForm";
import { TaskRow } from "./TaskRow";

export function TaskList({
  dayAgendaId,
  seq,
}: {
  dayAgendaId: number;
  seq: number;
}) {
  const { tasks, add, update, toggle, remove } = useTasks(dayAgendaId, seq);
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
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={(done) => toggle(t.id, done)}
              onSave={(txt) => update(t.id, txt)}
              onRemove={() => remove(t.id)}
            />
          ))}
        </ul>
      ) : (
        !open && <p className="tasks-empty">Nenhuma tarefa ainda.</p>
      )}
    </div>
  );
}
