type Props = {
  open: boolean;
  onToggle: () => void;
};

/** "Tarefas" title + the add/cancel toggle button. */
export function TasksHead({ open, onToggle }: Props) {
  return (
    <div className="tasks-head">
      <h3>Tarefas</h3>
      <button className="chip" onClick={onToggle}>
        {open ? "cancelar" : "+ tarefa"}
      </button>
    </div>
  );
}
