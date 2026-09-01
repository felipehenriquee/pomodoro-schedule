import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";
import { TaskList } from "./TaskList";
import { blockService } from "../services";
import { fmtFullDate, fmtHM, freqLabel, localRfc3339 } from "../lib/time";
import type { Block, BlockKind } from "../models";

type Props = {
  block: Block;
  readOnly?: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function EventDrawer({ block, readOnly = false, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const kindLabel: Record<BlockKind, string> = {
    work: t("common.kind.work"),
    short_break: t("common.kind.shortBreak"),
    long_break: t("common.kind.longBreak"),
  };

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
      setErr(t("eventDrawer.endBeforeStart"));
      setConfirming(false);
      return;
    }
    setSaving(true);
    try {
      await blockService.update({
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
          <h3>
            {readOnly ? t("eventDrawer.viewTitle") : t("eventDrawer.editTitle")}
          </h3>
          <button
            className="row-ico"
            title={t("common.close")}
            onClick={onClose}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="drawer-body">
          <label className="drawer-field">
            {t("eventDrawer.name")}
            <input
              value={name}
              disabled={readOnly}
              onChange={(e) => setName(e.target.value)}
              placeholder={kindLabel[block.kind]}
            />
          </label>

          <div className="row">
            <label className="drawer-field">
              {t("eventDrawer.start")}
              <input
                type="time"
                value={start}
                disabled={timesLocked}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label className="drawer-field">
              {t("eventDrawer.end")}
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
              {occurring
                ? t("eventDrawer.inProgressLocked")
                : t("eventDrawer.pastLocked")}
            </p>
          )}

          <div className="drawer-info">
            <div>{fmtFullDate(block.start_ts)}</div>
            <div className="epr-dim">
              {t("eventDrawer.frequency")}:{" "}
              {freqLabel(block.freq, block.days_of_week, block.interval_days)}
            </div>
          </div>

          {err && <p className="warn">{err}</p>}

          {!readOnly &&
            (confirming ? (
              <div className="drawer-confirm">
                <span>{t("eventDrawer.applyTo")}</span>
                <button
                  className="chip"
                  disabled={saving}
                  onClick={() => save("one")}
                >
                  {t("eventDrawer.onlyThis")}
                </button>
                <button
                  className="chip solid"
                  disabled={saving}
                  onClick={() => save("all")}
                >
                  {t("eventDrawer.allDays")}
                </button>
              </div>
            ) : (
              <button
                className="chip solid drawer-save"
                onClick={() => setConfirming(true)}
              >
                {t("eventDrawer.save")}
              </button>
            ))}

          {block.kind === "work" && (
            <>
              <hr className="drawer-sep" />
              <TaskList
                dayAgendaId={block.day_agenda_id}
                seq={block.seq ?? 1}
                templateId={block.manual ? undefined : block.template_id}
              />
            </>
          )}
        </div>
      </aside>
    </>
  );
}
