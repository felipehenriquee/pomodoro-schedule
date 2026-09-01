import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  onToggle: () => void;
};

/** "Tarefas" title + the add/cancel toggle button. */
export function TasksHead({ open, onToggle }: Props) {
  const { t } = useTranslation();

  return (
    <div className="tasks-head">
      <h3>{t("tasks.title")}</h3>
      <button className="chip" onClick={onToggle}>
        {open ? t("tasks.cancel") : t("tasks.add")}
      </button>
    </div>
  );
}
