import { useTranslation } from "react-i18next";
import { TemplateListItem } from "./TemplateListItem";
import type { Template } from "../../models";

type Props = {
  items: Template[];
  onEdit: (t: Template) => void;
  onClone: (t: Template) => void;
  onRemove: (id: number) => void;
};

/** The schedule list (or the empty-state message). */
export function TemplateList({ items, onEdit, onClone, onRemove }: Props) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return <p className="tasks-empty">{t("templateList.empty")}</p>;
  }

  return (
    <ul className="tpl-list">
      {items.map((item) => (
        <TemplateListItem
          key={item.id}
          template={item}
          onEdit={() => onEdit(item)}
          onClone={() => onClone(item)}
          onRemove={() => onRemove(item.id)}
        />
      ))}
    </ul>
  );
}
