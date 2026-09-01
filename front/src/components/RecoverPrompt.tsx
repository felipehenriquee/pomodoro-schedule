import { useState } from "react";
import { Icon } from "./Icon";
import { fmtDuration, isoDate } from "../lib/time";

type Props = {
  open: boolean;
  debtMs: number;
  onClose: () => void; // "agora não" (dismiss)
  onClear: () => void; // clear the balance
  onDoNow: () => void; // create a block starting now
  onEndOfDay: () => void; // create a block at the end of today
  onPickDateTime: (date: string, time: string) => void; // chosen date + time
};

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

export function RecoverPrompt({
  open,
  debtMs,
  onClose,
  onClear,
  onDoNow,
  onEndOfDay,
  onPickDateTime,
}: Props) {
  const [more, setMore] = useState(false);
  const [picking, setPicking] = useState(false);
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState("18:00");

  if (!open) return null;

  const close = () => {
    setMore(false);
    setPicking(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Tempo de foco pausado</h3>
        <p>
          Ficaram <strong>{fmtDuration(debtMs)}</strong> de foco em pausa. Deseja
          fazer agora?
        </p>

        <div className="recover-switch-wrap">
          {picking ? (
            <div className="recover-panel from-right" key="picker">
              <div className="recover-picker-row">
                <label>
                  Data
                  <input
                    type="date"
                    min={isoDate(new Date())}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <label>
                  Horário
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button className="chip" onClick={() => setPicking(false)}>
                  voltar
                </button>
                <button
                  className="chip solid"
                  disabled={!date || !time}
                  onClick={() => onPickDateTime(date, time)}
                >
                  agendar
                </button>
              </div>
            </div>
          ) : (
            <div className="recover-panel from-left" key="buttons">
              <div className="modal-actions">
                <button className="chip" onClick={close}>
                  agora não
                </button>
                <button className="chip solid" onClick={onDoNow}>
                  fazer agora
                </button>
                <button
                  className="row-ico"
                  title="Mais opções"
                  aria-expanded={more}
                  onClick={() => setMore((m) => !m)}
                >
                  <Icon name="more_vert" size={18} />
                </button>
              </div>

              <div className={`recover-more ${more ? "open" : ""}`}>
                <div className="recover-more-inner">
                  <button className="chip" onClick={onEndOfDay}>
                    adicionar ao fim do dia
                  </button>
                  <button className="chip" onClick={() => setPicking(true)}>
                    escolher data
                  </button>
                  <button className="chip" onClick={onClear}>
                    zerar saldo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
