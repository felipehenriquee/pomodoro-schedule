import { useState } from "react";
import { Icon } from "./Icon";
import { TaskList } from "./TaskList";
import { api } from "../lib/ipc";
import { fmtFullDate, fmtHM, freqLabel, localRfc3339 } from "../lib/time";
import type { Block, BlockKind } from "../lib/types";

const KIND_LABEL: Record<BlockKind, string> = {
  work: "Foco",
  short_break: "Pausa curta",
  long_break: "Pausa longa",
};

type Props = {
  block: Block;
  readOnly?: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function EventDrawer({ block, readOnly = false, onClose, onSaved }: Props) {
  const [name, setName] = useState(block.label ?? "");
  const [start, setStart] = useState(fmtHM(block.start_ts));
  const [end, setEnd] = useState(fmtHM(block.end_ts));
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const now = Date.now();
  const startedMs = new Date(block.start_ts).getTime();
  const endedMs = new Date(block.end_ts).getTime();
  const occurring = startedMs <= now && now < endedMs;
  const past = endedMs <= now;
  const timesLocked = readOnly || occurring || past;

  function buildTs(base: string, hm: string): Date {
    const d = new Date(base);
    const [h, m] = hm.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  }

  async function save(scope: "one" | "all") {
    setErr(null);
    const s = buildTs(block.start_ts, start);
    const e = buildTs(block.end_ts, end);
    if (e.getTime() <= s.getTime()) {
      setErr("O fim precisa ser depois do inicio.");
      setConfirming(false);
      return;
    }
    setSaving(true);
    try {
      await api.updateBlock({
        id: block.id,
        label: name.trim() || null,
        start_ts: localRfc3339(s),
        end_ts: localRfc3339(e),
        scope,
      });
      onSaved();
      onClose();
    } catch (e2) {
      setErr(String(e2));
    } finally {
      setSaving(false);
      setConfirming(false);
    }
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-head">
          <h3>{readOnly ? "Evento" : "Editar evento"}</h3>
          <button className="row-ico" title="Fechar" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="drawer-body">
          <label className="drawer-field">
            Nome
            <input
              value={name}
              disabled={readOnly}
              onChange={(e) => setName(e.target.value)}
              placeholder={KIND_LABEL[block.kind]}
            />
          </label>

          <div className="row">
            <label className="drawer-field">
              Inicio
              <input
                type="time"
                value={start}
                disabled={timesLocked}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label className="drawer-field">
              Fim
              <input
                type="time"
                value={end}
                disabled={timesLocked}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>

          {!readOnly && (occurring || past) && (
            <p className="epr-dim">
              {occurring ? "Evento em andamento" : "Evento ja passou"} &mdash; o
              horario nao pode ser alterado.
            </p>
          )}

          <div className="drawer-info">
            <div>{fmtFullDate(block.start_ts)}</div>
            <div className="epr-dim">
              Frequencia:{" "}
              {freqLabel(block.freq, block.days_of_week, block.interval_days)}
            </div>
          </div>

          {err && <p className="warn">{err}</p>}

          {!readOnly &&
            (confirming ? (
              <div className="drawer-confirm">
                <span>Aplicar em:</span>
                <button
                  className="chip"
                  disabled={saving}
                  onClick={() => save("one")}
                >
                  so este evento
                </button>
                <button
                  className="chip solid"
                  disabled={saving}
                  onClick={() => save("all")}
                >
                  todos os dias dessa agenda
                </button>
              </div>
            ) : (
              <button
                className="chip solid drawer-save"
                onClick={() => setConfirming(true)}
              >
                salvar
              </button>
            ))}

          {block.kind === "work" && (
            <>
              <hr className="drawer-sep" />
              <TaskList
                dayAgendaId={block.day_agenda_id}
                seq={block.seq ?? 1}
              />
            </>
          )}
        </div>
      </aside>
    </>
  );
}
