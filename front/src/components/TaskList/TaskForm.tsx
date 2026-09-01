import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  onAdd: (text: string) => void | Promise<void>;
};

/** The add-task textarea + "adicionar à checklist". Owns its own draft. */
export function TaskForm({ onAdd }: Props) {
  const { t } = useTranslation();
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
        placeholder={t("tasks.placeholder")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void submit();
        }}
      />
      <button className="chip solid" onClick={submit} disabled={!text.trim()}>
        {t("tasks.addToChecklist")}
      </button>
    </div>
  );
}
