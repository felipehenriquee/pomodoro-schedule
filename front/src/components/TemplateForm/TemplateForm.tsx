import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { templateService } from "../../services";
import { isoDate } from "../../lib/time";
import { Frequency } from "./Frequency";
import { NameRow } from "./rows/NameRow";
import { ValidityRow } from "./rows/ValidityRow";
import { ScheduleRow } from "./rows/ScheduleRow";
import { DurationsRow } from "./rows/DurationsRow";
import { LongBreaksRow } from "./rows/LongBreaksRow";
import { ActiveRow } from "./rows/ActiveRow";
import type { TemplateInput } from "../../models";

type FormProps = {
  onSaved: () => void;
  initial?: TemplateInput;
};

export function TemplateForm({ onSaved, initial }: FormProps) {
  const { t } = useTranslation();
  const editing = initial?.id != null;
  const [form, setForm] = useState<TemplateInput>(
    () =>
      initial ?? {
        name: t("templateForm.defaults.name"),
        days_of_week: ["MO", "TU", "WE", "TH", "FR"],
        start_time: "08:00",
        end_time: "18:00",
        work_min: 50,
        short_break_min: 10,
        active: true,
        freq: "weekly",
        anchor_date: null,
        interval_days: null,
        valid_from: null,
        valid_until: null,
        long_breaks: [
          {
            start_time: "12:00",
            end_time: "14:00",
            label: t("templateForm.defaults.lunch"),
          },
        ],
      }
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const today = isoDate(new Date());
  const patch = (p: Partial<TemplateInput>) =>
    setForm((f) => ({ ...f, ...p }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await templateService.save(form);
      setMsg(
        editing ? t("templateForm.savedEdit") : t("templateForm.savedNew")
      );
      onSaved();
    } catch (err) {
      setMsg(t("templateForm.saveError", { error: String(err) }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="tpl-form" onSubmit={submit}>
      <NameRow value={form.name} onChange={(name) => patch({ name })} />

      <Frequency
        freq={form.freq}
        daysOfWeek={form.days_of_week}
        anchorDate={form.anchor_date}
        intervalDays={form.interval_days}
        today={today}
        onChange={patch}
      />

      <ValidityRow
        validFrom={form.valid_from}
        validUntil={form.valid_until}
        editing={editing}
        today={today}
        onChange={patch}
      />

      <ScheduleRow
        startTime={form.start_time}
        endTime={form.end_time}
        onChange={patch}
      />

      <DurationsRow
        workMin={form.work_min}
        shortBreakMin={form.short_break_min}
        onChange={patch}
      />

      <LongBreaksRow
        value={form.long_breaks}
        onChange={(long_breaks) => patch({ long_breaks })}
      />

      <ActiveRow checked={form.active} onChange={(active) => patch({ active })} />

      <button type="submit" disabled={saving}>
        {saving
          ? t("templateForm.saving")
          : editing
            ? t("templateForm.saveChanges")
            : t("templateForm.saveSchedule")}
      </button>
      {msg && <p className="form-msg">{msg}</p>}
    </form>
  );
}
