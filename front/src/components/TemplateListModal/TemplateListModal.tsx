import { useCallback, useEffect, useState } from "react";
import { Modal } from "../Modal";
import { TemplateList } from "./TemplateList";
import { templateService } from "../../services";
import type { Template } from "../../models";

type Props = {
  open: boolean;
  onClose: () => void;
  onEdit: (t: Template) => void;
  onChanged: () => void;
};

export function TemplateListModal({ open, onClose, onEdit, onChanged }: Props) {
  const [items, setItems] = useState<Template[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      setItems(await templateService.list());
    } catch (e) {
      setErr(String(e));
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function remove(id: number) {
    try {
      await templateService.remove(id);
      await load();
      onChanged();
    } catch (e) {
      setErr(String(e));
    }
  }

  return (
    <Modal open={open} title="Agendas" size="md" onClose={onClose}>
      {err && <p className="warn">{err}</p>}
      <TemplateList items={items} onEdit={onEdit} onRemove={remove} />
    </Modal>
  );
}
