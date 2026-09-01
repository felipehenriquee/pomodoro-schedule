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
  const editing = initial?.id != null;
  return (
    <Modal
      open={open}
      title={editing ? "Editar agenda" : "Nova agenda"}
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
