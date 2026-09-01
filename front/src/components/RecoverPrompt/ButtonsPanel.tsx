import { useState } from "react";
import { Icon } from "../Icon";

type Props = {
  onClose: () => void;
  onDoNow: () => void;
  onEndOfDay: () => void;
  onClear: () => void;
  onPick: () => void; // switch to the date picker
};

/** Default branch: agora não / fazer agora + the "more options" menu. */
export function ButtonsPanel({
  onClose,
  onDoNow,
  onEndOfDay,
  onClear,
  onPick,
}: Props) {
  const [more, setMore] = useState(false);

  return (
    <div className="recover-panel from-left">
      <div className="modal-actions">
        <button className="chip" onClick={onClose}>
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
          <button className="chip" onClick={onPick}>
            escolher data
          </button>
          <button className="chip" onClick={onClear}>
            zerar saldo
          </button>
        </div>
      </div>
    </div>
  );
}
