import { TemplateForm } from "./TemplateForm";
import type { TemplateInput } from "../models";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: TemplateInput;
};

export function TemplateModal({ open, onClose, onSaved, initial }: Props) {
  if (!open) return null;
  const editing = initial?.id != null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{editing ? "Editar agenda" : "Nova agenda"}</h3>
          <button className="modal-close" onClick={onClose} title="Fechar">
            {"✕"}
          </button>
        </div>
        <TemplateForm
          key={initial?.id ?? "new"}
          initial={initial}
          onSaved={() => {
            onSaved();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
