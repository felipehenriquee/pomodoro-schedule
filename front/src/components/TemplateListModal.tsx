import { useCallback, useEffect, useState } from "react";
import { Icon } from "./Icon";
import { api } from "../lib/ipc";
import { freqLabel } from "../lib/time";
import type { Template } from "../lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onEdit: (t: Template) => void;
  onChanged: () => void;
};

export function TemplateListModal({ open, onClose, onEdit, onChanged }: Props) {
  const [items, setItems] = useState<Template[]>([]);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      setItems(await api.listTemplates());
    } catch (e) {
      setErr(String(e));
    }
  }, []);

  useEffect(() => {
    if (open) {
      setConfirmId(null);
      load();
    }
  }, [open, load]);

  if (!open) return null;

  async function remove(id: number) {
    try {
      await api.deleteTemplate(id);
      setConfirmId(null);
      await load();
      onChanged();
    } catch (e) {
      setErr(String(e));
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Agendas</h3>
          <button className="modal-close" onClick={onClose} title="Fechar">
            {"✕"}
          </button>
        </div>

        {err && <p className="warn">{err}</p>}

        {items.length === 0 ? (
          <p className="tasks-empty">Nenhuma agenda criada ainda.</p>
        ) : (
          <ul className="tpl-list">
            {items.map((t) => (
              <li key={t.id} className="tpl-list-item">
                <div className="tpl-list-info">
                  <strong>{t.name}</strong>
                  <span className="epr-dim">
                    {freqLabel(t.freq, t.days_of_week.join(","), t.interval_days)} ·{" "}
                    {t.start_time}&ndash;{t.end_time}
                    {t.active ? "" : " · inativa"}
                  </span>
                </div>

                {confirmId === t.id ? (
                  <div className="tpl-list-confirm">
                    <span>Excluir?</span>
                    <button className="chip" onClick={() => setConfirmId(null)}>
                      nao
                    </button>
                    <button className="chip solid" onClick={() => remove(t.id)}>
                      sim
                    </button>
                  </div>
                ) : (
                  <div className="tpl-list-actions">
                    <button
                      className="row-ico"
                      title="Editar"
                      onClick={() => onEdit(t)}
                    >
                      <Icon name="edit" size={18} />
                    </button>
                    <button
                      className="row-ico"
                      title="Excluir"
                      onClick={() => setConfirmId(t.id)}
                    >
                      <Icon name="delete" size={18} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
