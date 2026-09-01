import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EventCreateForm, type EventFormValues } from "./EventCreateForm";
import { Modal } from "../Modal";
import { blockService } from "../../services";
import { isoDate, localRfc3339 } from "../../lib/time";

type Props = {
  date: Date;
  onClose: () => void;
  onCreated: () => void;
};

export function EventCreateModal({ date, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function buildDate(hhmm: string): Date {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  }

  async function handleSubmit(v: EventFormValues) {
    setErr(null);
    setSaving(true);
    try {
      const pushed = await blockService.create({
        date: isoDate(date),
        kind: v.kind,
        label: v.name.trim() || null,
        start_ts: localRfc3339(buildDate(v.start)),
        end_ts: localRfc3339(buildDate(v.end)),
      });
      onCreated();
      if (pushed) {
        setNotice(t("eventCreate.conflictNotice"));
      } else {
        onClose();
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={t("eventCreate.modalTitle")} size="md" onClose={onClose}>
      {notice ? (
        <div className="tpl-form">
          <p className="form-msg">{notice}</p>
          <button className="chip solid" onClick={onClose}>
            {t("eventCreate.ok")}
          </button>
        </div>
      ) : (
        <EventCreateForm
          date={date}
          saving={saving}
          error={err}
          onSubmit={handleSubmit}
        />
      )}
    </Modal>
  );
}
