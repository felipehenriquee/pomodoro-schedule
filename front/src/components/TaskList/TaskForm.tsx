import { useState } from "react";

type Props = {
  onAdd: (text: string) => void | Promise<void>;
};

/** The add-task textarea + "adicionar a checklist". Owns its own draft. */
export function TaskForm({ onAdd }: Props) {
  const [text, setText] = useState("");

  async function submit() {
    if (!text.trim()) return;
    await onAdd(text);
    setText("");
  }

  return (
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
  );
}
