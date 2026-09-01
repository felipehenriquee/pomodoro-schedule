import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  initial: string;
  onCancel: () => void;
  onSave: (text: string) => void;
};

/** Edit mode: textarea seeded from `initial` + cancelar / salvar. */
export function TaskRowEdit({ initial, onCancel, onSave }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initial);

  return (
    <li className="task-editing">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
      />
      <div className="task-edit-actions">
        <button className="chip" onClick={onCancel}>
          {t("tasks.cancel")}
        </button>
        <button
          className="chip solid"
          disabled={!draft.trim()}
          onClick={() => onSave(draft)}
        >
          {t("tasks.save")}
        </button>
      </div>
    </li>
  );
}
