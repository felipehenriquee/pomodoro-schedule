import { TemplateListItem } from "./TemplateListItem";
import type { Template } from "../../models";

type Props = {
  items: Template[];
  onEdit: (t: Template) => void;
  onRemove: (id: number) => void;
};

/** The schedule list (or the empty-state message). */
export function TemplateList({ items, onEdit, onRemove }: Props) {
  if (items.length === 0) {
    return <p className="tasks-empty">Nenhuma agenda criada ainda.</p>;
  }

  return (
    <ul className="tpl-list">
      {items.map((t) => (
        <TemplateListItem
          key={t.id}
          template={t}
          onEdit={() => onEdit(t)}
          onRemove={() => onRemove(t.id)}
        />
      ))}
    </ul>
  );
}
