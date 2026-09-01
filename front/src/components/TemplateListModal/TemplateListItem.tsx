import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../Icon";
import { freqLabel } from "../../lib/time";
import type { Template } from "../../models";

type Props = {
  template: Template;
  onEdit: () => void;
  onRemove: () => void;
};

/** One row in the schedule list: info + edit/delete, with an inline delete confirm. */
export function TemplateListItem({ template, onEdit, onRemove }: Props) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="tpl-list-item">
      <div className="tpl-list-info">
        <strong>{template.name}</strong>
        <span className="epr-dim">
          {freqLabel(
            template.freq,
            template.days_of_week.join(","),
            template.interval_days
          )}{" "}
          · {template.start_time}&ndash;{template.end_time}
          {template.active ? "" : ` · ${t("templateList.inactive")}`}
        </span>
      </div>

      {confirming ? (
        <div className="tpl-list-confirm">
          <span>{t("templateList.confirmDelete")}</span>
          <button className="chip" onClick={() => setConfirming(false)}>
            {t("templateList.no")}
          </button>
          <button className="chip solid" onClick={onRemove}>
            {t("templateList.yes")}
          </button>
        </div>
      ) : (
        <div className="tpl-list-actions">
          <button
            className="row-ico"
            title={t("templateList.edit")}
            onClick={onEdit}
          >
            <Icon name="edit" size={18} />
          </button>
          <button
            className="row-ico"
            title={t("templateList.delete")}
            onClick={() => setConfirming(true)}
          >
            <Icon name="delete" size={18} />
          </button>
        </div>
      )}
    </li>
  );
}
