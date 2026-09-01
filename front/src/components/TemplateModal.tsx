import { useTranslation } from "react-i18next";
import { TemplateForm } from "./TemplateForm";
import { Modal } from "./Modal";
import type { TemplateInput } from "../models";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: TemplateInput;
};

export function TemplateModal({ open, onClose, onSaved, initial }: Props) {
  const { t } = useTranslation();
  const editing = initial?.id != null;

  return (
    <Modal
      open={open}
      title={editing ? t("templateModal.editTitle") : t("templateModal.newTitle")}
      size="md"
      onClose={onClose}
    >
      <TemplateForm
        key={initial?.id ?? "new"}
        initial={initial}
        onSaved={() => {
          onSaved();
          onClose();
        }}
      />
    </Modal>
  );
}
