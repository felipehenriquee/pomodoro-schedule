import { useState } from "react";
import { Icon } from "../Icon";
import { freqLabel } from "../../lib/time";
import type { Template } from "../../models";

type Props = {
  template: Template;
  onEdit: () => void;
  onRemove: () => void;
};

/** One row in the schedule list: info + edit/delete, with an inline delete confirm. */
export function TemplateListItem({ template: t, onEdit, onRemove }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="tpl-list-item">
      <div className="tpl-list-info">
        <strong>{t.name}</strong>
        <span className="epr-dim">
          {freqLabel(t.freq, t.days_of_week.join(","), t.interval_days)} ·{" "}
          {t.start_time}&ndash;{t.end_time}
          {t.active ? "" : " · inativa"}
        </span>
      </div>

      {confirming ? (
        <div className="tpl-list-confirm">
          <span>Excluir?</span>
          <button className="chip" onClick={() => setConfirming(false)}>
            nao
          </button>
          <button className="chip solid" onClick={onRemove}>
            sim
          </button>
        </div>
      ) : (
        <div className="tpl-list-actions">
          <button className="row-ico" title="Editar" onClick={onEdit}>
            <Icon name="edit" size={18} />
          </button>
          <button
            className="row-ico"
            title="Excluir"
            onClick={() => setConfirming(true)}
          >
            <Icon name="delete" size={18} />
          </button>
        </div>
      )}
    </li>
  );
}
