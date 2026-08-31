import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { Icon } from "./Icon";
import type { Task } from "../lib/types";

export function TaskList({
  dayAgendaId,
  seq,
}: {
  dayAgendaId: number;
  seq: number;
}) {
  const { tasks, add, update, toggle, remove } = useTasks(dayAgendaId, seq);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  async function submit() {
    if (!text.trim()) return;
    await add(text);
    setText("");
    setOpen(false);
  }

  return (
    <div className="tasks">
      <div className="tasks-head">
        <h3>Tarefas</h3>
        <button className="chip" onClick={() => setOpen((o) => !o)}>
          {open ? "cancelar" : "+ tarefa"}
        </button>
      </div>

      {open && (
        <div className="task-form">
          <textarea
            autoFocus
            placeholder="O que sera feito / o que foi feito..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void submit();
            }}
          />
          <button className="chip solid" onClick={submit} disabled={!text.trim()}>
            adicionar a checklist
          </button>
        </div>
      )}

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

function TaskRow({
  task,
  onToggle,
  onSave,
  onRemove,
}: {
  task: Task;
  onToggle: (done: boolean) => void;
  onSave: (text: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);

  if (editing) {
    return (
      <li className="task-editing">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
        <div className="task-edit-actions">
          <button
            className="chip"
            onClick={() => {
              setDraft(task.text);
              setEditing(false);
            }}
          >
            cancelar
          </button>
          <button
            className="chip solid"
            disabled={!draft.trim()}
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
          >
            salvar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className={task.done ? "done" : ""}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span>{task.text}</span>
      <button
        className="row-ico"
        title="editar"
        onClick={() => {
          setDraft(task.text);
          setEditing(true);
        }}
      >
        <Icon name="edit" size={16} />
      </button>
      <button className="row-ico" title="remover" onClick={onRemove}>
        <Icon name="delete" size={16} />
      </button>
    </li>
  );
}
