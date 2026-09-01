import { useState } from "react";
import { TaskRowView } from "./TaskRowView";
import { TaskRowEdit } from "./TaskRowEdit";
import type { Task } from "../../../models";

type Props = {
  task: Task;
  onToggle: (done: boolean) => void;
  onSave: (text: string) => void;
  onRemove: () => void;
  onPropagate?: () => void | Promise<void>;
};

/** One checklist row: toggles between the read view and the edit view. */
export function TaskRow({
  task,
  onToggle,
  onSave,
  onRemove,
  onPropagate,
}: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <TaskRowEdit
        initial={task.text}
        onCancel={() => setEditing(false)}
        onSave={(text) => {
          onSave(text);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <TaskRowView
      task={task}
      onToggle={onToggle}
      onEdit={() => setEditing(true)}
      onRemove={onRemove}
      onPropagate={onPropagate}
    />
  );
}
