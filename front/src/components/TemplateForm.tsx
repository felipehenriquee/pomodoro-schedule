import { useState, type FormEvent } from "react";
import { Icon } from "./Icon";
import { templateService } from "../services";
import { isoDate } from "../lib/time";
import type { Freq, LongBreakInput, TemplateInput, Weekday } from "../models";

const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: "MO", label: "Seg" },
  { key: "TU", label: "Ter" },
  { key: "WE", label: "Qua" },
  { key: "TH", label: "Qui" },
  { key: "FR", label: "Sex" },
  { key: "SA", label: "Sáb" },
  { key: "SU", label: "Dom" },
];

const FREQS: { key: Freq; label: string }[] = [
  { key: "once", label: "Não repetir" },
  { key: "daily", label: "Todos os dias" },
  { key: "weekly", label: "Dias da semana" },
  { key: "interval", label: "Intervalo de dias" },
];

const INITIAL: TemplateInput = {
  name: "Semana padrão",
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
  long_breaks: [{ start_time: "12:00", end_time: "14:00", label: "Almoço" }],
};

type FormProps = {
  onSaved: () => void;
  initial?: TemplateInput;
};

function nextDay(ds: string): string {
  const d = new Date(ds + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

export function TemplateForm({ onSaved, initial }: FormProps) {
  const editing = initial?.id != null;
  const [form, setForm] = useState<TemplateInput>(initial ?? INITIAL);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const today = isoDate(new Date());
  const minValidUntil = nextDay(form.valid_from ?? today);

  const set = <K extends keyof TemplateInput>(k: K, v: TemplateInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function setFreq(freq: Freq) {
    setForm((f) => ({
      ...f,
      freq,
      anchor_date:
        freq === "once" || freq === "interval"
          ? f.anchor_date ?? isoDate(new Date())
          : null,
      interval_days: freq === "interval" ? f.interval_days ?? 2 : null,
    }));
  }

  function toggleDay(d: Weekday) {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(d)
        ? f.days_of_week.filter((x) => x !== d)
        : [...f.days_of_week, d],
    }));
  }

  function updateBreak(i: number, patch: Partial<LongBreakInput>) {
    setForm((f) => ({
      ...f,
      long_breaks: f.long_breaks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await templateService.save(form);
      setMsg(
        editing
          ? "Agenda atualizada. Eventos futuros regenerados."
          : "Agenda salva."
      );
      onSaved();
    } catch (err) {
      setMsg(`Erro: ${err}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="tpl-form" onSubmit={submit}>
      <label>
        Nome
        <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
      </label>

      <label>
        Frequência
        <select
          value={form.freq}
          onChange={(e) => setFreq(e.target.value as Freq)}
        >
          {FREQS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      {form.freq === "weekly" && (
        <div className="field">
          <span className="field-label">Dias da semana</span>
          <div className="days">
            {WEEKDAYS.map((d) => (
              <button
                type="button"
                key={d.key}
                className={form.days_of_week.includes(d.key) ? "day on" : "day"}
                onClick={() => toggleDay(d.key)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {form.freq === "once" && (
        <label>
          Data
          <input
            type="date"
            min={today}
            value={form.anchor_date ?? ""}
            onChange={(e) => set("anchor_date", e.target.value || null)}
          />
        </label>
      )}

      {form.freq === "interval" && (
        <div className="row">
          <label>
            A cada (dias)
            <input
              type="number"
              min={1}
              value={form.interval_days ?? 2}
              onChange={(e) => set("interval_days", Number(e.target.value))}
            />
          </label>
          <label>
            A partir de
            <input
              type="date"
              min={today}
              value={form.anchor_date ?? ""}
              onChange={(e) => set("anchor_date", e.target.value || null)}
            />
          </label>
        </div>
      )}

      <div className="field">
        <span className="field-label">Validade (opcional)</span>
        <div className="row">
          <label>
            Válido de
            <input
              type="date"
              min={today}
              disabled={editing}
              title={editing ? "não pode mudar depois de criada" : undefined}
              value={form.valid_from ?? ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setForm((f) => ({
                  ...f,
                  valid_from: v,
                  valid_until: !v
                    ? null
                    : f.valid_until && f.valid_until <= v
                      ? nextDay(v)
                      : f.valid_until,
                }));
              }}
            />
          </label>
          <label>
            Válido até
            <input
              type="date"
              min={minValidUntil}
              disabled={!form.valid_from}
              value={form.valid_until ?? ""}
              onChange={(e) => set("valid_until", e.target.value || null)}
            />
          </label>
        </div>
      </div>

      <div className="row">
        <label>
          Início
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => set("start_time", e.target.value)}
          />
        </label>
        <label>
          Fim
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => set("end_time", e.target.value)}
          />
        </label>
      </div>

      <div className="row">
        <label>
          Foco (min)
          <input
            type="number"
            min={1}
            value={form.work_min}
            onChange={(e) => set("work_min", Number(e.target.value))}
          />
        </label>
        <label>
          Pausa curta (min, opcional)
          <input
            type="number"
            min={0}
            value={form.short_break_min}
            placeholder="0 = sem pausa curta"
            onChange={(e) => set("short_break_min", Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <div className="lb-section">
        <span className="field-label">Pausas longas</span>

        {form.long_breaks.map((b, i) => (
          <div className="lb-item" key={i}>
            <div className="lb-box">
              <input
                className="lb-label"
                value={b.label}
                placeholder="rótulo"
                onChange={(e) => updateBreak(i, { label: e.target.value })}
              />
              <div className="row">
                <label>
                  Início
                  <input
                    type="time"
                    value={b.start_time}
                    onChange={(e) => updateBreak(i, { start_time: e.target.value })}
                  />
                </label>
                <label>
                  Fim
                  <input
                    type="time"
                    value={b.end_time}
                    onChange={(e) => updateBreak(i, { end_time: e.target.value })}
                  />
                </label>
              </div>
            </div>
            <button
              type="button"
              className="row-ico lb-del"
              title="remover pausa longa"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  long_breaks: f.long_breaks.filter((_, idx) => idx !== i),
                }))
              }
            >
              <Icon name="delete" size={18} />
            </button>
          </div>
        ))}

        <button
          type="button"
          className="chip lb-add"
          onClick={() =>
            setForm((f) => ({
              ...f,
              long_breaks: [
                ...f.long_breaks,
                { start_time: "12:00", end_time: "13:00", label: "Pausa" },
              ],
            }))
          }
        >
          + pausa longa
        </button>
      </div>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => set("active", e.target.checked)}
        />
        Agenda ativa
      </label>

      <button type="submit" disabled={saving}>
        {saving
          ? "Salvando..."
          : editing
            ? "Salvar alterações"
            : "Salvar agenda"}
      </button>
      {msg && <p className="form-msg">{msg}</p>}
    </form>
  );
}
