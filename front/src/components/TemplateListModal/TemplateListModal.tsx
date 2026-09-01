import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";
import { TemplateList } from "./TemplateList";
import { templateService } from "../../services";
import type { Template } from "../../models";

type Props = {
  open: boolean;
  onClose: () => void;
  onEdit: (t: Template) => void;
  onClone: (t: Template) => void;
  onChanged: () => void;
};

export function TemplateListModal({
  open,
  onClose,
  onEdit,
  onClone,
  onChanged,
}: Props) {
  const { t } = useTranslation();
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
    <Modal open={open} title={t("templateList.title")} size="md" onClose={onClose}>
      {err && <p className="warn">{err}</p>}
      <TemplateList
        items={items}
        onEdit={onEdit}
        onClone={onClone}
        onRemove={remove}
      />
    </Modal>
  );
}
