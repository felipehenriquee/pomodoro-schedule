import { useState } from "react";
import { Icon } from "./Icon";
import { blockService } from "../services";
import { isoDate, localRfc3339 } from "../lib/time";
import type { BlockKind } from "../models";

const KINDS: { key: BlockKind; label: string; min: number }[] = [
  { key: "work", label: "Foco", min: 50 },
  { key: "short_break", label: "Pausa curta", min: 10 },
  { key: "long_break", label: "Pausa longa", min: 60 },
];

function hm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
    2,
    "0"
  )}`;
}
function addMin(hhmm: string, min: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const t = new Date(2000, 0, 1, h, m + min);
  return hm(t);
}

type Props = {
  date: Date;
  onClose: () => void;
  onCreated: () => void;
};

export function EventCreateModal({ date, onClose, onCreated }: Props) {
  const [kind, setKind] = useState<BlockKind>("work");
  const [name, setName] = useState("");
  const [start, setStart] = useState(hm(date));
  const [end, setEnd] = useState(addMin(hm(date), 50));
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function pickKind(k: BlockKind) {
    setKind(k);
    const min = KINDS.find((x) => x.key === k)?.min ?? 30;
    setEnd(addMin(start, min));
  }

  function buildDate(hhmm: string): Date {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  }

  async function save() {
    setErr(null);
    const s = buildDate(start);
    const e = buildDate(end);
    if (e.getTime() <= s.getTime()) {
      setErr("O fim precisa ser depois do inicio.");
      return;
    }
    setSaving(true);
    try {
      const pushed = await blockService.create({
        date: isoDate(date),
        kind,
        label: name.trim() || null,
        start_ts: localRfc3339(s),
        end_ts: localRfc3339(e),
      });
      onCreated();
      if (pushed) {
        setNotice(
          "Havia choque de horario: o(s) evento(s) anterior(es) serao feitos apos o novo terminar."
        );
      } else {
        onClose();
      }
    } catch (e2) {
      setErr(String(e2));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Novo evento</h3>
          <button className="modal-close" onClick={onClose} title="Fechar">
            {"✕"}
          </button>
        </div>

        {notice ? (
          <div className="tpl-form">
            <p className="form-msg">{notice}</p>
            <button className="chip solid" onClick={onClose}>
              ok
            </button>
          </div>
        ) : (
          <div className="tpl-form">
            <div className="field">
              <span className="field-label">Tipo</span>
              <div className="days">
                {KINDS.map((k) => (
                  <button
                    type="button"
                    key={k.key}
                    className={kind === k.key ? "day on" : "day"}
                    onClick={() => pickKind(k.key)}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            <label>
              Nome
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={KINDS.find((k) => k.key === kind)?.label}
              />
            </label>

            <div className="row">
              <label>
                Inicio
                <input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </label>
              <label>
                Fim
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </label>
            </div>

            {err && <p className="warn">{err}</p>}

            <button
              className="chip solid"
              disabled={saving}
              onClick={save}
              style={{ alignSelf: "flex-start" }}
            >
              <Icon name="edit" size={16} />
              criar evento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
