import { useState } from "react";
import { Icon } from "../Icon";
import { KindPicker } from "./KindPicker";
import { KINDS } from "./kinds";
import type { BlockKind } from "../../models";

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
function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export type EventFormValues = {
  kind: BlockKind;
  name: string;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
};

type Props = {
  date: Date;
  saving: boolean;
  /** error from the submit attempt (e.g. backend failure) */
  error?: string | null;
  onSubmit: (values: EventFormValues) => void;
};

export function EventCreateForm({ date, saving, error, onSubmit }: Props) {
  const [kind, setKind] = useState<BlockKind>("work");
  const [name, setName] = useState("");
  const [start, setStart] = useState(hm(date));
  const [end, setEnd] = useState(addMin(hm(date), 50));
  const [localErr, setLocalErr] = useState<string | null>(null);

  function pickKind(k: BlockKind) {
    setKind(k);
    const min = KINDS.find((x) => x.key === k)?.min ?? 30;
    setEnd(addMin(start, min));
  }

  function submit() {
    setLocalErr(null);
    if (toMin(end) <= toMin(start)) {
      setLocalErr("O fim precisa ser depois do inicio.");
      return;
    }
    onSubmit({ kind, name, start, end });
  }

  const shownErr = localErr ?? error;

  return (
    <div className="tpl-form">
      <KindPicker value={kind} onChange={pickKind} />

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

      {shownErr && <p className="warn">{shownErr}</p>}

      <button
        className="chip solid"
        disabled={saving}
        onClick={submit}
        style={{ alignSelf: "flex-start" }}
      >
        <Icon name="edit" size={16} />
        criar evento
      </button>
    </div>
  );
}
